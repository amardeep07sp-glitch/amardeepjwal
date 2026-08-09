import { Attribute } from './attribute.model.js';

export const attributeRepository = {
  async findPaginated({ page, limit, status, group, type, search, sortBy, sortOrder }) {
    const filter = {};
    if (status) filter.status = status;
    if (group) filter.group = group;
    if (type) filter.type = type;
    if (search) filter.name = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Attribute.find(filter).populate('group', 'name slug').sort(sort).skip(skip).limit(limit),
      Attribute.countDocuments(filter),
    ]);

    return { items, total };
  },

  findAll(filter = {}) {
    return Attribute.find(filter).populate('group', 'name slug').sort({ order: 1, name: 1 });
  },

  findById(id) {
    return Attribute.findById(id).populate('group', 'name slug');
  },

  create(data) {
    return Attribute.create(data);
  },

  async updateById(id, data) {
    const existing = await Attribute.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return Attribute.findByIdAndDelete(id);
  },

  countByGroup(groupId) {
    return Attribute.countDocuments({ group: groupId });
  },
};
