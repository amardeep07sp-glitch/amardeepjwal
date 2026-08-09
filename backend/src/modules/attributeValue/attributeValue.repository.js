import { AttributeValue } from './attributeValue.model.js';

export const attributeValueRepository = {
  async findPaginated({ page, limit, attribute, status, search, sortBy, sortOrder }) {
    const filter = {};
    if (attribute) filter.attribute = attribute;
    if (status) filter.status = status;
    if (search) filter.value = { $regex: search, $options: 'i' };

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      AttributeValue.find(filter).populate('attribute', 'name slug type').sort(sort).skip(skip).limit(limit),
      AttributeValue.countDocuments(filter),
    ]);

    return { items, total };
  },

  findAllByAttribute(attributeId) {
    return AttributeValue.find({ attribute: attributeId }).sort({ order: 1, value: 1 });
  },

  findById(id) {
    return AttributeValue.findById(id);
  },

  create(data) {
    return AttributeValue.create(data);
  },

  async updateById(id, data) {
    const existing = await AttributeValue.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return AttributeValue.findByIdAndDelete(id);
  },

  countByAttribute(attributeId) {
    return AttributeValue.countDocuments({ attribute: attributeId });
  },
};
