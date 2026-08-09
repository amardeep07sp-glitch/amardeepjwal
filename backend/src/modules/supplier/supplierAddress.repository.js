import { SupplierAddress } from './supplierAddress.model.js';

export const supplierAddressRepository = {
  findBySupplier(supplierId) {
    return SupplierAddress.find({ supplier: supplierId }).sort({ isDefault: -1, createdAt: -1 });
  },

  findById(id) {
    return SupplierAddress.findById(id);
  },

  create(data) {
    return SupplierAddress.create(data);
  },

  async updateById(id, data) {
    const existing = await SupplierAddress.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return SupplierAddress.findByIdAndDelete(id);
  },
};
