import { InventoryAlert } from './inventoryAlert.model.js';

export const inventoryAlertRepository = {
  create(data) {
    return InventoryAlert.create(data);
  },

  // Avoid spamming duplicate open alerts of the same type for the same
  // inventory record every time a movement re-triggers the same condition.
  findOpenByInventoryAndType(inventoryId, type) {
    return InventoryAlert.findOne({ inventory: inventoryId, type, status: 'open' });
  },

  async findPaginated({ page, limit, status, type }) {
    const filter = {};
    if (status) filter.status = status;
    if (type) filter.type = type;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      InventoryAlert.find(filter)
        .populate({ path: 'inventory', populate: [{ path: 'product', select: 'name sku' }, { path: 'warehouse', select: 'name code' }] })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      InventoryAlert.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return InventoryAlert.findById(id);
  },

  async updateById(id, data) {
    const existing = await InventoryAlert.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },
};
