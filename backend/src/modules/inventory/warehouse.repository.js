import { Warehouse } from './warehouse.model.js';

export const warehouseRepository = {
  async findPaginated({ page, limit, status, search, sortBy, sortOrder }) {
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { code: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Warehouse.find(filter).sort(sort).skip(skip).limit(limit),
      Warehouse.countDocuments(filter),
    ]);

    return { items, total };
  },

  findAll(filter = {}) {
    return Warehouse.find(filter).sort({ name: 1 });
  },

  findById(id) {
    return Warehouse.findById(id);
  },

  findDefault() {
    return Warehouse.findOne({ isDefault: true });
  },

  create(data) {
    return Warehouse.create(data);
  },

  async updateById(id, data) {
    const existing = await Warehouse.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return Warehouse.findByIdAndDelete(id);
  },

  deleteByIds(ids) {
    return Warehouse.deleteMany({ _id: { $in: ids } });
  },

  updateManyStatus(ids, status) {
    return Warehouse.updateMany({ _id: { $in: ids } }, { $set: { status } });
  },

  unsetDefaultExcept(exceptId) {
    return Warehouse.updateMany({ _id: { $ne: exceptId } }, { $set: { isDefault: false } });
  },
};
