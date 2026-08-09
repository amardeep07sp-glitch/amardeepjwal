import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { productRepository } from '../product/product.repository.js';
import { variantRepository } from '../product/variant/variant.repository.js';
import { mediaRepository } from '../media/media.repository.js';
import { MEDIA_ENTITY_TYPES, MEDIA_STATUSES } from '../media/media.constants.js';
import { warehouseRepository } from '../inventory/warehouse.repository.js';
import { inventoryService } from '../inventory/inventory.service.js';
import { inventoryLedgerService } from '../inventory/inventoryLedger.service.js';
import { barcodeRepository } from '../inventory/barcode.repository.js';
import { supplierRepository } from '../supplier/supplier.repository.js';
import { purchaseOrderRepository } from './purchaseOrder.repository.js';
import { purchaseItemRepository } from './purchaseItem.repository.js';
import { purchaseNumbering } from './purchase.numbering.js';
import { purchaseAudit } from './purchase.audit.js';
import { canTransition } from './purchase.statusTransition.js';
import { round2 } from '../product/pricing/priceCalculator.js';
import { PO_STATUSES, PO_PAYMENT_STATUSES } from './purchase.constants.js';
import { SUPPLIER_TIMELINE_EVENTS } from '../supplier/supplier.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Resolves one requested line item (product/variant/quantity/unitCost) into
// a fully snapshotted PurchaseItem payload - mirrors
// order.service.js#buildOrderItemPayload's shape, but unitCost is the
// buyer-entered purchase price, never re-derived from the product's own
// sale-side pricing.
async function buildPurchaseItemPayload({ product: productId, variant: variantId, quantity, unitCost, discount = 0, tax = 0 }) {
  const product = await productRepository.findRawById(productId);
  if (!product) throw new ApiError(404, `Product ${productId} not found`);

  let variant = null;
  if (variantId) {
    variant = await variantRepository.findById(variantId);
    if (!variant) throw new ApiError(404, `Variant ${variantId} not found`);
  }

  const { items: mediaItems } = await mediaRepository.findPaginatedByEntity(MEDIA_ENTITY_TYPES.PRODUCT, product._id, {
    variantId: null,
    status: MEDIA_STATUSES.ACTIVE,
    page: 1,
    limit: 1,
    sortBy: 'isFeatured',
    sortOrder: 'desc',
  });
  const image = mediaItems[0]?.cloudinary?.secureUrl ?? '';

  const barcode = await barcodeRepository.findActiveForEntity(product._id, variant?._id ?? null);

  return {
    product: product._id,
    variant: variant?._id ?? null,
    sku: variant?.sku ?? product.sku,
    barcode: barcode?._id ?? null,
    productSnapshot: { name: product.name, image },
    quantity,
    receivedQuantity: 0,
    returnedQuantity: 0,
    pendingQuantity: quantity,
    unitCost,
    discount,
    tax,
    total: round2(unitCost * quantity - discount + tax),
  };
}

const sumField = (items, field) => round2(items.reduce((sum, item) => sum + item[field], 0));

const buildSupplierSnapshot = (supplier) => ({
  name: supplier.name ?? '',
  email: supplier.email ?? '',
  phone: supplier.phone ?? '',
  gstNumber: supplier.gstNumber ?? '',
});

export const purchaseOrderService = {
  async listPurchaseOrders(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await purchaseOrderRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getPurchaseOrderById(id) {
    const purchaseOrder = await purchaseOrderRepository.findById(id);
    if (!purchaseOrder) throw new ApiError(404, 'Purchase order not found');
    const items = await purchaseItemRepository.findByPurchaseOrder(id);
    return { purchaseOrder, items };
  },

  // Creates the PurchaseOrder + all PurchaseItems in one transaction - a
  // half-written PO must never be possible, same discipline as
  // order.service.js#createOrder.
  async createPurchaseOrder(data, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const supplier = await supplierRepository.findRawById(data.supplier, session);
      if (!supplier) throw new ApiError(404, 'Supplier not found');

      const warehouseId = data.warehouse ?? (await warehouseRepository.findDefault())?._id;
      if (!warehouseId) throw new ApiError(500, 'No warehouse configured');

      const poNumber = await purchaseNumbering.getNextPoNumber();

      const purchaseOrder = await purchaseOrderRepository.create(
        {
          poNumber,
          supplier: data.supplier,
          warehouse: warehouseId,
          shippingCharge: data.shippingCharge ?? 0,
          expectedDeliveryDate: data.expectedDeliveryDate ?? null,
          internalNotes: data.internalNotes ?? '',
          status: PO_STATUSES.DRAFT,
          paymentStatus: PO_PAYMENT_STATUSES.PENDING,
          createdBy: userId,
          updatedBy: userId,
        },
        session
      );

      const itemPayloads = await Promise.all(
        data.items.map((item) => buildPurchaseItemPayload(item).then((payload) => ({ ...payload, purchaseOrder: purchaseOrder._id })))
      );
      await purchaseItemRepository.insertMany(itemPayloads, session);

      const subtotal = round2(itemPayloads.reduce((sum, i) => sum + i.unitCost * i.quantity, 0));
      const discount = sumField(itemPayloads, 'discount');
      const tax = sumField(itemPayloads, 'tax');

      purchaseOrder.subtotal = subtotal;
      purchaseOrder.discount = discount;
      purchaseOrder.tax = tax;
      purchaseOrder.grandTotal = round2(subtotal - discount + tax + purchaseOrder.shippingCharge);
      await purchaseOrder.save({ session });

      await purchaseAudit.record(
        {
          supplierId: data.supplier,
          event: SUPPLIER_TIMELINE_EVENTS.PO_CREATED,
          action: 'purchase_order.created',
          newValue: { poNumber, itemCount: itemPayloads.length, grandTotal: purchaseOrder.grandTotal },
          performedBy: userId,
          entityName: poNumber,
        },
        session
      );

      await session.commitTransaction();
      return purchaseOrderRepository.findById(purchaseOrder._id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // draft -> pending ("submitted for approval") - activity-only, no
  // supplier-facing timeline event, same precedent as
  // order.service.js#submitOrder.
  async submitForApproval(id, userId) {
    return this.transitionStatus(id, PO_STATUSES.PENDING, { userId });
  },

  // pending -> approved. Resolves the immutable supplierSnapshot exactly
  // once, at this moment - the "commitment" point in the PO lifecycle,
  // mirroring order.service.js#confirmOrder's snapshot resolution.
  async approvePurchaseOrder(id, userId) {
    const purchaseOrder = await purchaseOrderRepository.findRawById(id);
    if (!purchaseOrder) throw new ApiError(404, 'Purchase order not found');
    if (!canTransition(purchaseOrder.status, PO_STATUSES.APPROVED)) {
      throw new ApiError(400, `Cannot approve a purchase order in status "${purchaseOrder.status}"`);
    }

    if (!purchaseOrder.supplierSnapshot) {
      const supplier = await supplierRepository.findRawById(purchaseOrder.supplier);
      if (supplier) purchaseOrder.supplierSnapshot = buildSupplierSnapshot(supplier);
    }

    const oldStatus = purchaseOrder.status;
    purchaseOrder.status = PO_STATUSES.APPROVED;
    purchaseOrder.updatedBy = userId;
    await purchaseOrder.save();

    await purchaseAudit.record({
      supplierId: purchaseOrder.supplier,
      event: SUPPLIER_TIMELINE_EVENTS.PO_APPROVED,
      action: 'purchase_order.approved',
      oldValue: { status: oldStatus },
      newValue: { status: PO_STATUSES.APPROVED },
      performedBy: userId,
      entityName: purchaseOrder.poNumber,
    });

    return purchaseOrderRepository.findById(id);
  },

  // approved -> ordered. Commits every line item's quantity as
  // Inventory.incomingQuantity (the ONLY place this ever happens) - the
  // sole door into Inventory this transition uses is
  // inventoryService.commitPurchaseOrder, never the repository directly.
  async markOrdered(id, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const purchaseOrder = await purchaseOrderRepository.findRawById(id, session);
      if (!purchaseOrder) throw new ApiError(404, 'Purchase order not found');
      if (!canTransition(purchaseOrder.status, PO_STATUSES.ORDERED)) {
        throw new ApiError(400, `Cannot mark a purchase order in status "${purchaseOrder.status}" as ordered`);
      }

      const items = await purchaseItemRepository.findByPurchaseOrder(id, session);
      const touchedInventoryIds = [];

      for (const item of items) {
        // eslint-disable-next-line no-await-in-loop
        const inventory = await inventoryService.findOrCreateForScope(item.product, item.variant, purchaseOrder.warehouse, item.sku, session);
        // eslint-disable-next-line no-await-in-loop
        await inventoryService.commitPurchaseOrder(inventory._id, item.pendingQuantity, {
          referenceType: 'purchase_order',
          referenceId: purchaseOrder._id,
          performedBy: userId,
          session,
        });
        touchedInventoryIds.push(inventory._id);
      }

      const oldStatus = purchaseOrder.status;
      purchaseOrder.status = PO_STATUSES.ORDERED;
      purchaseOrder.updatedBy = userId;
      await purchaseOrder.save({ session });

      await purchaseAudit.record(
        {
          supplierId: purchaseOrder.supplier,
          event: SUPPLIER_TIMELINE_EVENTS.PO_ORDERED,
          action: 'purchase_order.ordered',
          oldValue: { status: oldStatus },
          newValue: { status: PO_STATUSES.ORDERED },
          performedBy: userId,
          entityName: purchaseOrder.poNumber,
        },
        session
      );

      await session.commitTransaction();

      await Promise.all(touchedInventoryIds.map((invId) => inventoryLedgerService.evaluateAlertsAfterCommit(invId)));

      return purchaseOrderRepository.findById(id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // Cancellable from any non-terminal status. If stock was already
  // committed as incoming (Ordered/Partially Received), releases whatever
  // portion was never actually received.
  async cancelPurchaseOrder(id, { userId, reason } = {}) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const purchaseOrder = await purchaseOrderRepository.findRawById(id, session);
      if (!purchaseOrder) throw new ApiError(404, 'Purchase order not found');
      if (!canTransition(purchaseOrder.status, PO_STATUSES.CANCELLED)) {
        throw new ApiError(400, `Cannot cancel a purchase order in status "${purchaseOrder.status}"`);
      }

      const hadIncomingCommitted = [PO_STATUSES.ORDERED, PO_STATUSES.PARTIALLY_RECEIVED].includes(purchaseOrder.status);
      const touchedInventoryIds = [];

      if (hadIncomingCommitted) {
        const items = await purchaseItemRepository.findByPurchaseOrder(id, session);
        for (const item of items) {
          if (item.pendingQuantity <= 0) continue; // eslint-disable-line no-continue
          // eslint-disable-next-line no-await-in-loop
          const inventory = await inventoryService.findOrCreateForScope(item.product, item.variant, purchaseOrder.warehouse, item.sku, session);
          // eslint-disable-next-line no-await-in-loop
          await inventoryService.releasePurchaseCommitment(inventory._id, item.pendingQuantity, {
            referenceType: 'purchase_order',
            referenceId: purchaseOrder._id,
            performedBy: userId,
            session,
          });
          touchedInventoryIds.push(inventory._id);
        }
      }

      const oldStatus = purchaseOrder.status;
      purchaseOrder.status = PO_STATUSES.CANCELLED;
      purchaseOrder.updatedBy = userId;
      await purchaseOrder.save({ session });

      await purchaseAudit.record(
        {
          supplierId: purchaseOrder.supplier,
          event: SUPPLIER_TIMELINE_EVENTS.PO_CANCELLED,
          action: 'purchase_order.cancelled',
          oldValue: { status: oldStatus },
          newValue: { status: PO_STATUSES.CANCELLED },
          reason,
          performedBy: userId,
          entityName: purchaseOrder.poNumber,
        },
        session
      );

      await session.commitTransaction();

      await Promise.all(touchedInventoryIds.map((invId) => inventoryLedgerService.evaluateAlertsAfterCommit(invId)));

      return purchaseOrderRepository.findById(id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // Generic guard-and-persist for transitions with no side effects of their
  // own - mirrors order.service.js#transitionStatus.
  async transitionStatus(id, toStatus, { userId, event, reason } = {}) {
    const purchaseOrder = await purchaseOrderRepository.findRawById(id);
    if (!purchaseOrder) throw new ApiError(404, 'Purchase order not found');
    if (!canTransition(purchaseOrder.status, toStatus)) {
      throw new ApiError(400, `Cannot move a purchase order from "${purchaseOrder.status}" to "${toStatus}"`);
    }

    const oldStatus = purchaseOrder.status;
    purchaseOrder.status = toStatus;
    purchaseOrder.updatedBy = userId;
    await purchaseOrder.save();

    await purchaseAudit.record({
      supplierId: purchaseOrder.supplier,
      event: event ?? null,
      action: 'purchase_order.status_changed',
      oldValue: { status: oldStatus },
      newValue: { status: toStatus },
      reason,
      performedBy: userId,
      entityName: purchaseOrder.poNumber,
    });

    return purchaseOrderRepository.findById(id);
  },

  async getDashboardTotals() {
    return purchaseOrderRepository.getDashboardTotals();
  },

  async getPurchaseTrend(days = 14) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - (days - 1));
    sinceDate.setHours(0, 0, 0, 0);

    const rows = await purchaseOrderRepository.getPurchaseTrend(sinceDate);
    const byDate = Object.fromEntries(rows.map((r) => [r._id, { orders: r.orders, value: r.value }]));

    const series = [];
    for (let i = 0; i < days; i += 1) {
      const d = new Date(sinceDate);
      d.setDate(d.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      series.push({ date: key, orders: byDate[key]?.orders ?? 0, value: byDate[key]?.value ?? 0 });
    }
    return series;
  },

  async getSupplierPerformance() {
    return purchaseOrderRepository.getSupplierPerformance();
  },
};
