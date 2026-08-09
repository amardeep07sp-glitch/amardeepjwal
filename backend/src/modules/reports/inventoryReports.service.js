import mongoose from 'mongoose';
import { Inventory } from '../inventory/inventory.model.js';
import { InventoryMovement } from '../inventory/inventoryMovement.model.js';
import { OrderItem } from '../order/orderItem.model.js';
import { inventoryRepository } from '../inventory/inventory.repository.js';
import { buildPaginationMeta, paginateStages } from './reportFilters.util.js';

// Thin proxies - Current/Low/Out-of-Stock are just the existing Inventory
// list filtered by stockStatus (Phase 6), not a new aggregation. Exposed
// here so the Reports Center has one consistent namespace for every
// inventory report, without duplicating inventoryRepository's own logic.
export const inventoryReportsService = {
  getCurrentStock(query) {
    return inventoryRepository.findPaginated(query);
  },

  getLowStock(query) {
    return inventoryRepository.findPaginated({ ...query, stockStatus: 'low_stock' });
  },

  getOutOfStock(query) {
    return inventoryRepository.findPaginated({ ...query, stockStatus: 'out_of_stock' });
  },

  // Ex-tax stock value on hand - availableQuantity * the product's current
  // cost price, per inventory record. costPrice is read live from Product
  // (a valuation report always reflects TODAY's cost basis, matching how
  // real inventory valuation reports work - not the historical cost at
  // whatever point stock was originally received).
  async getInventoryValuation({ warehouse, page, limit }) {
    const match = { availableQuantity: { $gt: 0 } };
    if (warehouse) match.warehouse = new mongoose.Types.ObjectId(warehouse);

    const pipeline = [
      { $match: match },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productDoc' } },
      { $unwind: '$productDoc' },
      {
        $project: {
          sku: 1,
          availableQuantity: 1,
          warehouse: 1,
          name: '$productDoc.name',
          costPrice: { $ifNull: ['$productDoc.pricing.costPrice', 0] },
          value: { $multiply: ['$availableQuantity', { $ifNull: ['$productDoc.pricing.costPrice', 0] }] },
        },
      },
      { $sort: { value: -1 } },
    ];

    const [rows, totalAgg, grandTotalAgg] = await Promise.all([
      Inventory.aggregate([...pipeline, ...paginateStages(page, limit)]),
      Inventory.aggregate([...pipeline, { $count: 'total' }]),
      Inventory.aggregate([...pipeline, { $group: { _id: null, grandTotal: { $sum: '$value' } } }]),
    ]);

    return {
      items: rows,
      meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0),
      grandTotal: grandTotalAgg[0]?.grandTotal ?? 0,
    };
  },

  async getStockMovement({ dateFrom, dateTo, inventory, movementType, page, limit }) {
    const filter = {};
    if (inventory) filter.inventory = new mongoose.Types.ObjectId(inventory);
    if (movementType) filter.movementType = movementType;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      InventoryMovement.find(filter)
        .populate({ path: 'product', select: 'name sku' })
        .populate({ path: 'warehouse', select: 'name code' })
        .populate({ path: 'performedBy', select: 'name' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      InventoryMovement.countDocuments(filter),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  // Age since the record's last quantity-changing movement, bucketed the
  // same way Accounting's Receivables/Payables aging buckets are (0-30/
  // 31-60/61-90/90+) for a familiar reading experience across the app.
  async getInventoryAging({ warehouse, page, limit }) {
    const match = { availableQuantity: { $gt: 0 } };
    if (warehouse) match.warehouse = new mongoose.Types.ObjectId(warehouse);

    const now = new Date();
    const pipeline = [
      { $match: match },
      { $lookup: { from: 'products', localField: 'product', foreignField: '_id', as: 'productDoc' } },
      { $unwind: '$productDoc' },
      {
        $project: {
          sku: 1,
          availableQuantity: 1,
          updatedAt: 1,
          name: '$productDoc.name',
          ageDays: { $divide: [{ $subtract: [now, '$updatedAt'] }, 1000 * 60 * 60 * 24] },
        },
      },
      { $sort: { ageDays: -1 } },
    ];

    const [rows, totalAgg] = await Promise.all([
      Inventory.aggregate([...pipeline, ...paginateStages(page, limit)]),
      Inventory.aggregate([...pipeline, { $count: 'total' }]),
    ]);

    const items = rows.map((r) => ({ ...r, ageDays: Math.floor(r.ageDays) }));
    return { items, meta: buildPaginationMeta(page, limit, totalAgg[0]?.total ?? 0) };
  },

  // Sales velocity over a lookback window - ranks every inventory item by
  // units sold. Fast/Slow are the same ranked list read from either end;
  // Dead Stock is the disjoint set that sold zero units at all in the
  // window despite having stock on hand.
  async _getSalesVelocity(days) {
    const sinceDate = new Date();
    sinceDate.setDate(sinceDate.getDate() - days);

    return OrderItem.aggregate([
      { $lookup: { from: 'orders', localField: 'order', foreignField: '_id', as: 'order' } },
      { $unwind: '$order' },
      { $match: { 'order.createdAt': { $gte: sinceDate }, 'order.orderStatus': { $nin: ['draft', 'cancelled'] } } },
      { $group: { _id: { product: '$product', variant: '$variant' }, unitsSold: { $sum: '$quantity' } } },
    ]);
  },

  async getFastMoving({ days = 30, limit = 20 }) {
    const velocity = await this._getSalesVelocity(days);
    const ranked = velocity.sort((a, b) => b.unitsSold - a.unitsSold).slice(0, limit);
    return this._joinVelocityToInventory(ranked);
  },

  async getSlowMoving({ days = 30, limit = 20 }) {
    const velocity = await this._getSalesVelocity(days);
    const ranked = velocity.filter((v) => v.unitsSold > 0).sort((a, b) => a.unitsSold - b.unitsSold).slice(0, limit);
    return this._joinVelocityToInventory(ranked);
  },

  async _joinVelocityToInventory(ranked) {
    const results = [];
    for (const row of ranked) {
      // eslint-disable-next-line no-await-in-loop
      const inv = await Inventory.findOne({ product: row._id.product, variant: row._id.variant ?? null })
        .populate({ path: 'product', select: 'name sku' });
      if (inv) results.push({ inventoryId: inv._id, name: inv.product?.name, sku: inv.sku, unitsSold: row.unitsSold, availableQuantity: inv.availableQuantity });
    }
    return results;
  },

  async getDeadStock({ days = 90, limit = 50 }) {
    const velocity = await this._getSalesVelocity(days);
    const soldProductIds = new Set(velocity.map((v) => `${v._id.product}:${v._id.variant ?? ''}`));

    const candidates = await Inventory.find({ availableQuantity: { $gt: 0 }, active: true })
      .populate({ path: 'product', select: 'name sku' })
      .sort({ updatedAt: 1 })
      .limit(limit * 3);

    const deadStock = candidates
      .filter((inv) => !soldProductIds.has(`${inv.product?._id}:${inv.variant ?? ''}`))
      .slice(0, limit)
      .map((inv) => ({ inventoryId: inv._id, name: inv.product?.name, sku: inv.sku, availableQuantity: inv.availableQuantity, lastMovementAt: inv.updatedAt }));

    return deadStock;
  },
};
