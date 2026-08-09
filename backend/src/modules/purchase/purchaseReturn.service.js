import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { purchaseOrderRepository } from './purchaseOrder.repository.js';
import { purchaseItemRepository } from './purchaseItem.repository.js';
import { purchaseReturnRepository } from './purchaseReturn.repository.js';
import { purchaseNumbering } from './purchase.numbering.js';
import { purchaseAudit } from './purchase.audit.js';
import { supplierLedgerService } from './supplierLedger.service.js';
import { accountingEvents } from '../accounting/accountingEvents.service.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { inventoryLedgerService } from '../inventory/inventoryLedger.service.js';
import { round2 } from '../product/pricing/priceCalculator.js';
import { canTransitionReturn } from './purchase.statusTransition.js';
import { PURCHASE_RETURN_STATUSES, SUPPLIER_LEDGER_TYPES, PO_RECEIVABLE_STATUSES, PO_STATUSES } from './purchase.constants.js';
import { SUPPLIER_TIMELINE_EVENTS } from '../supplier/supplier.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// A line item is only returnable once it's been physically received AND
// not already returned in full by a previous PurchaseReturn.
const availableToReturn = (purchaseItem) => purchaseItem.receivedQuantity - purchaseItem.returnedQuantity;

export const purchaseReturnService = {
  async listReturns(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await purchaseReturnRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  listForPurchaseOrder(purchaseOrderId) {
    return purchaseReturnRepository.findByPurchaseOrder(purchaseOrderId);
  },

  // Returnable once at least one unit has actually been received - a PO
  // that's still only Ordered (nothing arrived yet) has nothing to return;
  // use Cancel instead.
  async requestReturn(purchaseOrderId, { items, reason, action }, userId) {
    const purchaseOrder = await purchaseOrderRepository.findRawById(purchaseOrderId);
    if (!purchaseOrder) throw new ApiError(404, 'Purchase order not found');
    if (![...PO_RECEIVABLE_STATUSES, PO_STATUSES.RECEIVED].includes(purchaseOrder.status)) {
      throw new ApiError(400, `Cannot return goods against a purchase order in status "${purchaseOrder.status}"`);
    }

    let amount = 0;
    const resolvedLines = [];
    for (const line of items) {
      // eslint-disable-next-line no-await-in-loop
      const purchaseItem = await purchaseItemRepository.findById(line.purchaseItem);
      if (!purchaseItem || String(purchaseItem.purchaseOrder) !== String(purchaseOrderId)) {
        throw new ApiError(404, `Purchase item ${line.purchaseItem} does not belong to this purchase order`);
      }
      if (line.quantity <= 0 || line.quantity > availableToReturn(purchaseItem)) {
        throw new ApiError(
          400,
          `Cannot return ${line.quantity} units for SKU ${purchaseItem.sku} - only ${availableToReturn(purchaseItem)} available to return`
        );
      }
      amount = round2(amount + line.quantity * purchaseItem.unitCost);
      resolvedLines.push({ purchaseItem: purchaseItem._id, quantity: line.quantity });
    }

    const returnNumber = await purchaseNumbering.getNextReturnNumber();
    const purchaseReturn = await purchaseReturnRepository.create({
      returnNumber,
      purchaseOrder: purchaseOrderId,
      supplier: purchaseOrder.supplier,
      items: resolvedLines,
      reason: reason || '',
      action,
      status: PURCHASE_RETURN_STATUSES.REQUESTED,
      amount,
      requestedBy: userId,
    });

    await purchaseAudit.record({
      supplierId: purchaseOrder.supplier,
      event: SUPPLIER_TIMELINE_EVENTS.RETURN_REQUESTED,
      action: 'purchase_return.requested',
      newValue: { returnNumber, itemCount: resolvedLines.length, amount, reason, returnAction: action },
      performedBy: userId,
      entityName: returnNumber,
    });

    return purchaseReturn;
  },

  async approveReturn(id, userId) {
    return this._guardedTransition(id, PURCHASE_RETURN_STATUSES.APPROVED, { approvedBy: userId }, userId);
  },

  async rejectReturn(id, userId) {
    return this._guardedTransition(id, PURCHASE_RETURN_STATUSES.REJECTED, { approvedBy: userId }, userId);
  },

  async _guardedTransition(returnId, toStatus, patch, userId) {
    const purchaseReturn = await purchaseReturnRepository.findById(returnId);
    if (!purchaseReturn) throw new ApiError(404, 'Purchase return not found');
    if (!canTransitionReturn(purchaseReturn.status, toStatus)) {
      throw new ApiError(400, `Cannot move a purchase return from "${purchaseReturn.status}" to "${toStatus}"`);
    }

    const updated = await purchaseReturnRepository.updateById(returnId, { status: toStatus, ...patch });

    await purchaseAudit.record({
      supplierId: purchaseReturn.supplier,
      action: `purchase_return.${toStatus}`,
      oldValue: { status: purchaseReturn.status },
      newValue: { status: toStatus },
      performedBy: userId,
      entityName: purchaseReturn.returnNumber,
    });

    return updated;
  },

  // The one step that actually touches Inventory - debits availableQuantity
  // via inventoryService.recordPurchaseReturn (never the repository
  // directly), one movement per line item, and posts the immutable
  // SupplierLedger 'return' entry reducing what we owe - all inside a
  // single transaction.
  async completeReturn(returnId, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const purchaseReturn = await purchaseReturnRepository.findById(returnId, session);
      if (!purchaseReturn) throw new ApiError(404, 'Purchase return not found');
      if (!canTransitionReturn(purchaseReturn.status, PURCHASE_RETURN_STATUSES.COMPLETED)) {
        throw new ApiError(400, `Cannot complete a purchase return in status "${purchaseReturn.status}"`);
      }

      const purchaseOrder = await purchaseOrderRepository.findRawById(purchaseReturn.purchaseOrder, session);
      const touchedInventoryIds = [];

      for (const line of purchaseReturn.items) {
        // eslint-disable-next-line no-await-in-loop
        const purchaseItem = await purchaseItemRepository.findById(line.purchaseItem, session);
        if (!purchaseItem) continue; // eslint-disable-line no-continue

        // eslint-disable-next-line no-await-in-loop
        const inventory = await inventoryService.findOrCreateForScope(
          purchaseItem.product,
          purchaseItem.variant,
          purchaseOrder.warehouse,
          purchaseItem.sku,
          session
        );
        // eslint-disable-next-line no-await-in-loop
        await inventoryService.recordPurchaseReturn(inventory._id, line.quantity, {
          referenceType: 'purchase_return',
          referenceId: returnId,
          performedBy: userId,
          session,
        });
        touchedInventoryIds.push(inventory._id);

        // eslint-disable-next-line no-await-in-loop
        await purchaseItemRepository.applyReturn(purchaseItem._id, line.quantity, session);
      }

      purchaseReturn.status = PURCHASE_RETURN_STATUSES.COMPLETED;
      await purchaseReturn.save({ session });

      await supplierLedgerService.recordEntry(
        {
          supplierId: purchaseReturn.supplier,
          type: SUPPLIER_LEDGER_TYPES.RETURN,
          amount: -purchaseReturn.amount,
          reason: `Goods returned to supplier (${purchaseReturn.returnNumber})`,
          referenceType: 'purchase_return',
          referenceId: purchaseReturn._id,
          performedBy: userId,
        },
        session
      );

      // Purchase Accounting event - reverses this return's proportional
      // share of the PO's Input GST, mirroring the GRN's proportional tax
      // booking exactly (see goodsReceiptNote.service.js#receiveGoods).
      const taxForThisReturn = purchaseOrder.subtotal > 0 ? round2((purchaseOrder.tax ?? 0) * (purchaseReturn.amount / purchaseOrder.subtotal)) : 0;
      await accountingEvents.recordPurchaseReturn(
        {
          purchaseOrderId: purchaseOrder._id,
          supplierId: purchaseReturn.supplier,
          returnNumber: purchaseReturn.returnNumber,
          returnValue: purchaseReturn.amount,
          taxAmount: taxForThisReturn,
          isInterState: false,
          performedBy: userId,
        },
        session
      );

      await purchaseAudit.record(
        {
          supplierId: purchaseReturn.supplier,
          event: SUPPLIER_TIMELINE_EVENTS.RETURN_PROCESSED,
          action: 'purchase_return.completed',
          newValue: { returnNumber: purchaseReturn.returnNumber, amount: purchaseReturn.amount },
          performedBy: userId,
          entityName: purchaseReturn.returnNumber,
        },
        session
      );

      await session.commitTransaction();

      await Promise.all(touchedInventoryIds.map((id) => inventoryLedgerService.evaluateAlertsAfterCommit(id)));

      return purchaseReturn;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },
};
