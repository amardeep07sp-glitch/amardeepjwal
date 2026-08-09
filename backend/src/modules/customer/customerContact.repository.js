import { CustomerContact } from './customerContact.model.js';

export const customerContactRepository = {
  findByCustomer(customerId) {
    return CustomerContact.find({ customer: customerId }).sort({ isPrimary: -1, createdAt: -1 });
  },

  findById(id) {
    return CustomerContact.findById(id);
  },

  create(data) {
    return CustomerContact.create(data);
  },

  async updateById(id, data) {
    const existing = await CustomerContact.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return CustomerContact.findByIdAndDelete(id);
  },
};
