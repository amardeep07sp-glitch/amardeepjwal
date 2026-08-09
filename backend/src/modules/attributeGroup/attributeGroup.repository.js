import { AttributeGroup } from './attributeGroup.model.js';

export const attributeGroupRepository = {
  async findPaginated({ page, limit, status, search, sortBy, sortOrder }) {
    const filter = {};
    if (status) filter.status = status;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AttributeGroup.find(filter).sort(sort).skip(skip).limit(limit),
      AttributeGroup.countDocuments(filter),
    ]);

    return { items, total };
  },

  findAll(filter = {}) {
    return AttributeGroup.find(filter).sort({ order: 1, name: 1 });
  },

  findById(id) {
    return AttributeGroup.findById(id);
  },

  create(data) {
    return AttributeGroup.create(data);
  },

  async updateById(id, data) {
    const existing = await AttributeGroup.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return AttributeGroup.findByIdAndDelete(id);
  },
};
