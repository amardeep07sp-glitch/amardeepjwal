import { Inventory } from './inventory.model.js';

const POPULATE_FIELDS = [
  { path: 'product', select: 'name slug sku' },
  { path: 'variant', select: 'sku slug' },
  { path: 'warehouse', select: 'name code' },
];

export const inventoryRepository = {
  async findPaginated({ page, limit, warehouse, stockStatus, product, active, search, sortBy, sortOrder }) {
    const filter = {};
    if (warehouse) filter.warehouse = warehouse;
    if (stockStatus) filter.stockStatus = stockStatus;
    if (product) filter.product = product;
    if (active !== undefined) filter.active = active;
    if (search) filter.sku = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Inventory.find(filter).populate(POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      Inventory.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return Inventory.findById(id).populate(POPULATE_FIELDS);
  },

  // Unpopulated - used internally by the ledger service, which only needs
  // raw quantity fields and refs, not display data.
  findRawById(id, session) {
    return Inventory.findById(id).session(session ?? null);
  },

  findOneByScope(productId, variantId, warehouseId, session) {
    return Inventory.findOne({ product: productId, variant: variantId ?? null, warehouse: warehouseId }).session(
      session ?? null
    );
  },

  findAllByProduct(productId) {
    return Inventory.find({ product: productId }).populate(POPULATE_FIELDS);
  },

  // Used by the CSV export - unpaginated by design (an inventory export is a
  // point-in-time snapshot, not a browsing list).
  findAllForExport() {
    return Inventory.find({}).populate(POPULATE_FIELDS).sort({ sku: 1 });
  },

  // Used by the settings-only CSV import to match rows by SKU.
  findBySku(sku) {
    return Inventory.findOne({ sku });
  },

  async create(data, session) {
    const [created] = await Inventory.create([data], { session: session ?? undefined });
    return created;
  },

  // Non-quantity fields only (minimumStock/maximumStock/reorderLevel/active/
  // barcode/sku) - never availableQuantity et al. See applyMovementDelta.
  async updateById(id, data) {
    const existing = await Inventory.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  // THE only method permitted to change quantity fields - called exclusively
  // by inventoryLedgerService.recordMovement() inside its transaction.
  // `fieldDeltas` is e.g. { availableQuantity: -2 } (can be negative).
  async applyMovementDelta(id, fieldDeltas, newStockStatus, session) {
    const inc = {};
    for (const [field, delta] of Object.entries(fieldDeltas)) {
      inc[field] = delta;
    }
    return Inventory.findByIdAndUpdate(
      id,
      { $inc: inc, $set: { stockStatus: newStockStatus } },
      { new: true, session: session ?? undefined }
    );
  },

  deleteById(id) {
    return Inventory.findByIdAndDelete(id);
  },

  countByWarehouse(warehouseId) {
    return Inventory.countDocuments({ warehouse: warehouseId });
  },

  countByProduct(productId) {
    return Inventory.countDocuments({ product: productId });
  },

  countByBarcode(barcodeId) {
    return Inventory.countDocuments({ barcode: barcodeId });
  },

  async getDashboardTotals() {
    const [totals] = await Inventory.aggregate([
      {
        $group: {
          _id: null,
          totalAvailable: { $sum: '$availableQuantity' },
          totalReserved: { $sum: '$reservedQuantity' },
          totalDamaged: { $sum: '$damagedQuantity' },
          totalReturned: { $sum: '$returnedQuantity' },
          totalIncoming: { $sum: '$incomingQuantity' },
          lowStockCount: {
            $sum: { $cond: [{ $eq: ['$stockStatus', 'low_stock'] }, 1, 0] },
          },
          outOfStockCount: {
            $sum: { $cond: [{ $eq: ['$stockStatus', 'out_of_stock'] }, 1, 0] },
          },
          totalRecords: { $sum: 1 },
        },
      },
    ]);

    return (
      totals ?? {
        totalAvailable: 0,
        totalReserved: 0,
        totalDamaged: 0,
        totalReturned: 0,
        totalIncoming: 0,
        lowStockCount: 0,
        outOfStockCount: 0,
        totalRecords: 0,
      }
    );
  },

  // Summed across every warehouse - the storefront only ever needs "is
  // anything sellable at all", not the per-warehouse breakdown. Used by
  // product.service.js's public reads to derive each card's inStock flag.
  getAvailableQuantityByProductIds(productIds) {
    return Inventory.aggregate([
      { $match: { product: { $in: productIds } } },
      { $group: { _id: '$product', totalAvailable: { $sum: '$availableQuantity' } } },
    ]);
  },

  // Same idea, per-variant - a PDP's size selector needs to know which
  // specific size is in/out of stock, not just the product overall.
  getAvailableQuantityByVariantIds(variantIds) {
    return Inventory.aggregate([
      { $match: { variant: { $in: variantIds } } },
      { $group: { _id: '$variant', totalAvailable: { $sum: '$availableQuantity' } } },
    ]);
  },
};
