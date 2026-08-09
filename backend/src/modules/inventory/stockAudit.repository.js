import { StockAudit } from './stockAudit.model.js';

export const stockAuditRepository = {
  async findPaginated({ page, limit, status, inventory }) {
    const filter = {};
    if (status) filter.status = status;
    if (inventory) filter.inventory = inventory;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      StockAudit.find(filter)
        .populate({ path: 'inventory', populate: [{ path: 'product', select: 'name sku' }, { path: 'warehouse', select: 'name code' }] })
        .populate('performedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockAudit.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return StockAudit.findById(id).populate('inventory').populate('performedBy', 'name');
  },

  findRawById(id) {
    return StockAudit.findById(id);
  },

  create(data) {
    return StockAudit.create(data);
  },

  async updateById(id, data) {
    const existing = await StockAudit.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },
};
