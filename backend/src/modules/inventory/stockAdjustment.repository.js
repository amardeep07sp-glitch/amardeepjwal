import { StockAdjustment } from './stockAdjustment.model.js';

export const stockAdjustmentRepository = {
  async findPaginated({ page, limit, status, inventory }) {
    const filter = {};
    if (status) filter.status = status;
    if (inventory) filter.inventory = inventory;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      StockAdjustment.find(filter)
        .populate({ path: 'inventory', populate: [{ path: 'product', select: 'name sku' }, { path: 'warehouse', select: 'name code' }] })
        .populate('requestedBy', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockAdjustment.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return StockAdjustment.findById(id).populate('inventory').populate('requestedBy', 'name').populate('approvedBy', 'name');
  },

  create(data) {
    return StockAdjustment.create(data);
  },

  async updateById(id, data) {
    const existing = await StockAdjustment.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },
};
