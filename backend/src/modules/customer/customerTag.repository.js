import { CustomerTag } from './customerTag.model.js';

export const customerTagRepository = {
  findAll() {
    return CustomerTag.find({}).sort({ name: 1 });
  },

  findById(id) {
    return CustomerTag.findById(id);
  },

  create(data) {
    return CustomerTag.create(data);
  },

  async updateById(id, data) {
    const existing = await CustomerTag.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return CustomerTag.findByIdAndDelete(id);
  },
};
