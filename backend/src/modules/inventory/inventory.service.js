import { ApiError } from '../../utils/ApiError.js';
import { inventoryRepository } from './inventory.repository.js';
import { inventoryMovementRepository } from './inventoryMovement.repository.js';
import { inventoryLedgerService } from './inventoryLedger.service.js';
import { warehouseRepository } from './warehouse.repository.js';
import { MOVEMENT_TYPES } from './inventory.constants.js';
import { buildInventoryCsv, parseInventorySettingsCsv } from './inventory.csv.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const inventoryService = {
  async listInventory(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await inventoryRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getInventoryById(id) {
    const inventory = await inventoryRepository.findById(id);
    if (!inventory) throw new ApiError(404, 'Inventory record not found');
    return inventory;
  },

  getInventoryForProduct(productId) {
    return inventoryRepository.findAllByProduct(productId);
  },

  async getLedger(inventoryId, query) {
    const { page, limit } = query;
    const { items, total } = await inventoryMovementRepository.findPaginatedByInventory(inventoryId, { page, limit });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  getRecentMovements(limit) {
    return inventoryMovementRepository.findRecent(limit);
  },

  getDashboardTotals() {
    return inventoryRepository.getDashboardTotals();
  },

  // Called by product.service.js#createProduct - creates the zero-stock
  // Inventory record for a simple (non-variant) product. Not itself a
  // "movement" (nothing changed from/to anything), so no ledger row here -
  // an admin later sets real opening stock via a MANUAL_ADJUSTMENT or the
  // dedicated opening-stock action, which does go through recordMovement.
  async provisionForProduct(product, session) {
    const defaultWarehouse = await warehouseRepository.findDefault();
    if (!defaultWarehouse) throw new ApiError(500, 'No default warehouse configured');

    return inventoryRepository.create(
      {
        product: product._id,
        variant: null,
        warehouse: defaultWarehouse._id,
        sku: product.sku,
        createdBy: product.createdBy ?? null,
      },
      session
    );
  },

  // Called by variant.service.js#createVariant/generateVariants/bulkDuplicate
  // - batched, since generateVariants can create dozens of variants at once.
  async provisionForVariants(variants, productId, session) {
    if (variants.length === 0) return [];
    const defaultWarehouse = await warehouseRepository.findDefault();
    if (!defaultWarehouse) throw new ApiError(500, 'No default warehouse configured');

    const created = [];
    for (const variant of variants) {
      // eslint-disable-next-line no-await-in-loop
      const record = await inventoryRepository.create(
        {
          product: productId,
          variant: variant._id,
          warehouse: defaultWarehouse._id,
          sku: variant.sku,
        },
        session
      );
      created.push(record);
    }
    return created;
  },

  async updateInventorySettings(id, data, userId) {
    const inventory = await inventoryRepository.updateById(id, { ...data, updatedBy: userId });
    if (!inventory) throw new ApiError(404, 'Inventory record not found');
    return inventory;
  },

  async exportInventoryCsv() {
    const records = await inventoryRepository.findAllForExport();
    return buildInventoryCsv(records);
  },

  // Deliberately settings-only (minimumStock/maximumStock/reorderLevel) -
  // see inventory.csv.js for why quantities can never be bulk-imported.
  // Never throws on a bad row - collects per-row errors so one typo doesn't
  // abort an otherwise-good batch, and reports exactly what happened.
  async importInventorySettingsCsv(buffer, userId) {
    const rows = parseInventorySettingsCsv(buffer);
    const result = { updated: 0, skipped: 0, errors: [] };

    for (const [index, row] of rows.entries()) {
      if (!row.sku) {
        result.skipped += 1;
        result.errors.push({ row: index + 2, message: 'Missing sku' });
        continue; // eslint-disable-line no-continue
      }

      // eslint-disable-next-line no-await-in-loop
      const existing = await inventoryRepository.findBySku(row.sku);
      if (!existing) {
        result.skipped += 1;
        result.errors.push({ row: index + 2, message: `No inventory record found for SKU "${row.sku}"` });
        continue; // eslint-disable-line no-continue
      }

      const patch = {};
      if (row.minimumStock !== undefined) patch.minimumStock = row.minimumStock;
      if (row.maximumStock !== undefined) patch.maximumStock = row.maximumStock;
      if (row.reorderLevel !== undefined) patch.reorderLevel = row.reorderLevel;

      if (Object.keys(patch).length === 0) {
        result.skipped += 1;
        result.errors.push({ row: index + 2, message: 'No recognized columns to update' });
        continue; // eslint-disable-line no-continue
      }

      // eslint-disable-next-line no-await-in-loop
      await inventoryRepository.updateById(existing._id, { ...patch, updatedBy: userId });
      result.updated += 1;
    }

    return result;
  },

  // ---- Reservation Engine ----
  //
  // Every method below accepts an optional `session` - Phase 6 (single-call
  // API, no driver existed yet) never needed it, but Phase 7's
  // order.service.js reserves/releases/converts stock for MULTIPLE items
  // inside its own outer transaction (confirmOrder, cancelOrder,
  // markDelivered). Without threading that session through,
  // recordMovement() would open and commit its OWN independent transaction
  // per item - breaking atomicity: if item 3 of 5 failed, items 1-2's
  // already-committed reservations could never be rolled back by the outer
  // transaction's abort. Omitting `session` (existing callers, tests)
  // behaves exactly as before - recordMovement still owns and commits its
  // own transaction in that case.

  reserveStock(inventoryId, quantity, { referenceType = 'order', referenceId = null, performedBy = null, session } = {}) {
    return inventoryLedgerService.recordMovement(
      {
        inventoryId,
        movementType: MOVEMENT_TYPES.RESERVATION,
        quantityChanged: quantity,
        extraFieldDeltas: { availableQuantity: -quantity },
        reason: 'Stock reserved',
        referenceType,
        referenceId,
        performedBy,
      },
      session
    );
  },

  releaseReservation(inventoryId, quantity, { referenceType = 'order', referenceId = null, performedBy = null, session } = {}) {
    return inventoryLedgerService.recordMovement(
      {
        inventoryId,
        movementType: MOVEMENT_TYPES.RESERVATION_RELEASE,
        quantityChanged: -quantity,
        extraFieldDeltas: { availableQuantity: quantity },
        reason: 'Reservation released',
        referenceType,
        referenceId,
        performedBy,
      },
      session
    );
  },

  // The reserved unit has now actually left the building - only
  // reservedQuantity decreases (availableQuantity was already carved out
  // when the reservation was made, so it's untouched here).
  convertReservationToSale(
    inventoryId,
    quantity,
    { referenceType = 'order', referenceId = null, performedBy = null, session } = {}
  ) {
    return inventoryLedgerService.recordMovement(
      {
        inventoryId,
        movementType: MOVEMENT_TYPES.SALE,
        primaryFieldOverride: 'reservedQuantity',
        quantityChanged: -quantity,
        reason: 'Reservation converted to sale',
        referenceType,
        referenceId,
        performedBy,
      },
      session
    );
  },

  // Order Return Engine (Phase 7) calls this on the RESTOCK step, never
  // directly - credits returnedQuantity via the same ledger choke-point as
  // every other stock change. Deliberately does NOT touch availableQuantity
  // itself; a separate manual adjustment moves returned stock back into
  // sellable availableQuantity once QC/grading is done, same as jewellery
  // resale in this business normally requires a manual check.
  recordReturn(
    inventoryId,
    quantity,
    { referenceType = 'order_return', referenceId = null, performedBy = null, session } = {}
  ) {
    return inventoryLedgerService.recordMovement(
      {
        inventoryId,
        movementType: MOVEMENT_TYPES.RETURN,
        quantityChanged: quantity,
        reason: 'Order return restocked',
        referenceType,
        referenceId,
        performedBy,
      },
      session
    );
  },

  // Finds the (product, variant, warehouse) Inventory record a Purchase
  // Order/GRN line item needs, creating a fresh zero-stock one if this is
  // the first time that product has ever been stocked in this warehouse -
  // the exact same find-or-create precedent stockTransfer.service.js
  // #completeTransfer already established for its destination warehouse.
  // Reused by both purchaseOrder.service.js#markOrdered and
  // goodsReceiptNote.service.js#receiveGoods so neither duplicates it.
  async findOrCreateForScope(productId, variantId, warehouseId, sku, session) {
    let inventory = await inventoryRepository.findOneByScope(productId, variantId, warehouseId, session);
    if (!inventory) {
      inventory = await inventoryRepository.create({ product: productId, variant: variantId ?? null, warehouse: warehouseId, sku }, session);
    }
    return inventory;
  },

  // ---- Purchase & Supplier Engine (Phase 9) ----
  //
  // The ONLY door Purchase module code may use to touch Inventory - mirrors
  // the Order Reservation Engine's contract exactly (session-threaded,
  // never a direct repository call). A Purchase Order commits incoming
  // stock the moment it's marked Ordered, a Goods Receipt Note converts
  // that commitment into real available stock (possibly across several
  // partial GRNs), and a Purchase Return sends stock back out.

  // approved -> ordered: stock is "on the way" before it physically
  // arrives, visible on Inventory.incomingQuantity so buyers/staff can see
  // it's coming without it being sellable yet.
  commitPurchaseOrder(
    inventoryId,
    quantity,
    { referenceType = 'purchase_order', referenceId = null, performedBy = null, session } = {}
  ) {
    return inventoryLedgerService.recordMovement(
      {
        inventoryId,
        movementType: MOVEMENT_TYPES.PURCHASE_ORDERED,
        quantityChanged: quantity,
        reason: 'Purchase order placed with supplier',
        referenceType,
        referenceId,
        performedBy,
      },
      session
    );
  },

  // A Purchase Order is cancelled before (full) receipt - releases whatever
  // portion of its committed incomingQuantity was never actually received.
  releasePurchaseCommitment(
    inventoryId,
    quantity,
    { referenceType = 'purchase_order', referenceId = null, performedBy = null, session } = {}
  ) {
    return inventoryLedgerService.recordMovement(
      {
        inventoryId,
        movementType: MOVEMENT_TYPES.PURCHASE_ORDER_CANCELLED,
        quantityChanged: -quantity,
        reason: 'Purchase order cancelled - incoming commitment released',
        referenceType,
        referenceId,
        performedBy,
      },
      session
    );
  },

  // A Goods Receipt Note actually receives stock - credits availableQuantity
  // (reusing the existing PURCHASE movement type, its intended purpose since
  // Phase 6) and, in the same write, debits back the incomingQuantity that
  // commitPurchaseOrder reserved for it. goodsReceiptNote.service.js
  // guarantees receivedQuantity per line never exceeds that line's
  // pendingQuantity, so this can never push incomingQuantity negative.
  receivePurchase(
    inventoryId,
    quantity,
    { referenceType = 'goods_receipt_note', referenceId = null, performedBy = null, session } = {}
  ) {
    return inventoryLedgerService.recordMovement(
      {
        inventoryId,
        movementType: MOVEMENT_TYPES.PURCHASE,
        quantityChanged: quantity,
        extraFieldDeltas: { incomingQuantity: -quantity },
        reason: 'Goods received against purchase order',
        referenceType,
        referenceId,
        performedBy,
      },
      session
    );
  },

  // Stock physically leaves the building back to the supplier - debits
  // availableQuantity directly (never returnedQuantity - that field is
  // reserved for CUSTOMER returns coming back in, see recordReturn above).
  recordPurchaseReturn(
    inventoryId,
    quantity,
    { referenceType = 'purchase_return', referenceId = null, performedBy = null, session } = {}
  ) {
    return inventoryLedgerService.recordMovement(
      {
        inventoryId,
        movementType: MOVEMENT_TYPES.PURCHASE_RETURN,
        quantityChanged: -quantity,
        reason: 'Stock returned to supplier',
        referenceType,
        referenceId,
        performedBy,
      },
      session
    );
  },
};
