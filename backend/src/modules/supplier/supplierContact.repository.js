import { SupplierContact } from './supplierContact.model.js';

export const supplierContactRepository = {
  findBySupplier(supplierId) {
    return SupplierContact.find({ supplier: supplierId }).sort({ isPrimary: -1, createdAt: -1 });
  },

  findById(id) {
    return SupplierContact.findById(id);
  },

  create(data) {
    return SupplierContact.create(data);
  },

  async updateById(id, data) {
    const existing = await SupplierContact.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return SupplierContact.findByIdAndDelete(id);
  },
};
