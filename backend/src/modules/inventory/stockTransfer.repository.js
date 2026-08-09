import { StockTransfer } from './stockTransfer.model.js';

export const stockTransferRepository = {
  async findPaginated({ page, limit, status }) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      StockTransfer.find(filter)
        .populate({ path: 'inventory', populate: { path: 'product', select: 'name sku' } })
        .populate('fromWarehouse', 'name code')
        .populate('toWarehouse', 'name code')
        .populate('requestedBy', 'name')
        .populate('approvedBy', 'name')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      StockTransfer.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return StockTransfer.findById(id)
      .populate('inventory')
      .populate('fromWarehouse', 'name code')
      .populate('toWarehouse', 'name code')
      .populate('requestedBy', 'name')
      .populate('approvedBy', 'name');
  },

  findRawById(id) {
    return StockTransfer.findById(id);
  },

  create(data) {
    return StockTransfer.create(data);
  },

  async updateById(id, data) {
    const existing = await StockTransfer.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },
};
