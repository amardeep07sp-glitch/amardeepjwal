import { Address } from './address.model.js';

export const addressRepository = {
  findByCustomer(customerId) {
    return Address.find({ customer: customerId }).sort({ createdAt: -1 });
  },

  findById(id) {
    return Address.findById(id);
  },

  create(data) {
    return Address.create(data);
  },

  async updateById(id, data) {
    const existing = await Address.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return Address.findByIdAndDelete(id);
  },

  // Scoped per customer AND per default-type, so setting a new default
  // billing address never clobbers the customer's default shipping address.
  unsetDefaultExcept(customerId, field, exceptId) {
    return Address.updateMany({ customer: customerId, _id: { $ne: exceptId } }, { $set: { [field]: false } });
  },
};
