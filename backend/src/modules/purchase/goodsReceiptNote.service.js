import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { purchaseOrderRepository } from './purchaseOrder.repository.js';
import { purchaseItemRepository } from './purchaseItem.repository.js';
import { goodsReceiptNoteRepository } from './goodsReceiptNote.repository.js';
import { purchaseNumbering } from './purchase.numbering.js';
import { purchaseAudit } from './purchase.audit.js';
import { supplierLedgerService } from './supplierLedger.service.js';
import { accountingEvents } from '../accounting/accountingEvents.service.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { inventoryLedgerService } from '../inventory/inventoryLedger.service.js';
import { round2 } from '../product/pricing/priceCalculator.js';
import { PO_STATUSES, PO_RECEIVABLE_STATUSES, SUPPLIER_LEDGER_TYPES } from './purchase.constants.js';
import { SUPPLIER_TIMELINE_EVENTS } from '../supplier/supplier.constants.js';

export const goodsReceiptNoteService = {
  listForPurchaseOrder(purchaseOrderId) {
    return goodsReceiptNoteRepository.findByPurchaseOrder(purchaseOrderId);
  },

  // Receives inventory against a Purchase Order - the ONLY place Purchase
  // module code calls inventoryService.receivePurchase(). Supports both
  // Full Receive (every line's full pendingQuantity) and Partial Receive
  // (a subset), and multiple GRNs per PO by design - pendingQuantity on
  // each PurchaseItem is what makes repeated partial receipts safe: this
  // method can never receive more than what's still outstanding.
  async receiveGoods(purchaseOrderId, { items, notes }, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const purchaseOrder = await purchaseOrderRepository.findRawById(purchaseOrderId, session);
      if (!purchaseOrder) throw new ApiError(404, 'Purchase order not found');
      if (!PO_RECEIVABLE_STATUSES.includes(purchaseOrder.status)) {
        throw new ApiError(400, `Cannot receive goods against a purchase order in status "${purchaseOrder.status}"`);
      }

      const resolvedLines = [];
      for (const line of items) {
        // eslint-disable-next-line no-await-in-loop
        const purchaseItem = await purchaseItemRepository.findById(line.purchaseItem, session);
        if (!purchaseItem || String(purchaseItem.purchaseOrder) !== String(purchaseOrderId)) {
          throw new ApiError(404, `Purchase item ${line.purchaseItem} does not belong to this purchase order`);
        }
        if (line.receivedQuantity <= 0 || line.receivedQuantity > purchaseItem.pendingQuantity) {
          throw new ApiError(
            400,
            `Cannot receive ${line.receivedQuantity} units for SKU ${purchaseItem.sku} - only ${purchaseItem.pendingQuantity} pending`
          );
        }
        resolvedLines.push({ purchaseItem, receivedQuantity: line.receivedQuantity });
      }

      const grnNumber = await purchaseNumbering.getNextGrnNumber();
      const grn = await goodsReceiptNoteRepository.create(
        {
          grnNumber,
          purchaseOrder: purchaseOrderId,
          items: resolvedLines.map((l) => ({ purchaseItem: l.purchaseItem._id, receivedQuantity: l.receivedQuantity })),
          notes: notes || '',
          receivedBy: userId,
        },
        session
      );

      const touchedInventoryIds = [];
      let grnValue = 0;

      for (const line of resolvedLines) {
        const { purchaseItem, receivedQuantity } = line;
        // eslint-disable-next-line no-await-in-loop
        const inventory = await inventoryService.findOrCreateForScope(
          purchaseItem.product,
          purchaseItem.variant,
          purchaseOrder.warehouse,
          purchaseItem.sku,
          session
        );
        // eslint-disable-next-line no-await-in-loop
        await inventoryService.receivePurchase(inventory._id, receivedQuantity, {
          referenceType: 'goods_receipt_note',
          referenceId: grn._id,
          performedBy: userId,
          session,
        });
        touchedInventoryIds.push(inventory._id);

        // eslint-disable-next-line no-await-in-loop
        await purchaseItemRepository.applyReceipt(purchaseItem._id, receivedQuantity, session);

        grnValue = round2(grnValue + receivedQuantity * purchaseItem.unitCost);
      }

      // Recompute the PO's overall status from every item's fresh
      // pendingQuantity - Received only once every line is fully received.
      const allItems = await purchaseItemRepository.findByPurchaseOrder(purchaseOrderId, session);
      const allReceived = allItems.every((i) => i.pendingQuantity <= 0);
      purchaseOrder.status = allReceived ? PO_STATUSES.RECEIVED : PO_STATUSES.PARTIALLY_RECEIVED;
      purchaseOrder.updatedBy = userId;
      await purchaseOrder.save({ session });

      // Liability to the supplier is recognized NOW - at the moment goods
      // actually arrive - not when the PO was merely placed. See
      // purchase.constants.js's SUPPLIER_LEDGER_TYPES comment.
      await supplierLedgerService.recordEntry(
        {
          supplierId: purchaseOrder.supplier,
          type: SUPPLIER_LEDGER_TYPES.PURCHASE,
          amount: grnValue,
          reason: `Goods received against ${purchaseOrder.poNumber} (${grnNumber})`,
          referenceType: 'goods_receipt_note',
          referenceId: grn._id,
          performedBy: userId,
        },
        session
      );

      // Purchase Accounting event - this GRN's proportional share of the
      // PO's total tax (received value / PO subtotal), since a partial
      // receipt shouldn't book the whole PO's Input GST at once.
      // isInterState defaults false (intra-state, CGST+SGST split) -
      // Supplier/Warehouse don't carry a state comparison yet, see
      // tax.service.js#splitTax's header comment.
      const taxForThisGrn = purchaseOrder.subtotal > 0 ? round2((purchaseOrder.tax ?? 0) * (grnValue / purchaseOrder.subtotal)) : 0;
      await accountingEvents.recordPurchaseReceipt(
        {
          purchaseOrderId: purchaseOrder._id,
          supplierId: purchaseOrder.supplier,
          poNumber: purchaseOrder.poNumber,
          grnValue,
          taxAmount: taxForThisGrn,
          isInterState: false,
          performedBy: userId,
        },
        session
      );

      await purchaseAudit.record(
        {
          supplierId: purchaseOrder.supplier,
          event: SUPPLIER_TIMELINE_EVENTS.GRN_RECEIVED,
          action: 'goods_receipt_note.received',
          newValue: { grnNumber, poNumber: purchaseOrder.poNumber, grnValue, allReceived },
          performedBy: userId,
          entityName: grnNumber,
        },
        session
      );

      await session.commitTransaction();

      // Every receivePurchase call above ran under our externalSession, so
      // none evaluated alerts itself - now that our own transaction is
      // genuinely committed, do it for every inventory record touched.
      await Promise.all(touchedInventoryIds.map((id) => inventoryLedgerService.evaluateAlertsAfterCommit(id)));

      return goodsReceiptNoteRepository.findById(grn._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
