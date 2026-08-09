import { CustomerSegment } from './customerSegment.model.js';

export const customerSegmentRepository = {
  findAll() {
    return CustomerSegment.find({}).sort({ name: 1 });
  },

  findById(id) {
    return CustomerSegment.findById(id);
  },

  findByName(name) {
    return CustomerSegment.findOne({ name });
  },

  create(data) {
    return CustomerSegment.create(data);
  },

  async updateById(id, data) {
    const existing = await CustomerSegment.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return CustomerSegment.findByIdAndDelete(id);
  },
};
