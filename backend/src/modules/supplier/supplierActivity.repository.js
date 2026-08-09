import { SupplierActivity } from './supplierActivity.model.js';

export const supplierActivityRepository = {
  findBySupplier(supplierId) {
    return SupplierActivity.find({ supplier: supplierId }).sort({ createdAt: -1 }).populate({ path: 'performedBy', select: 'name' });
  },

  async create(data, session) {
    const [created] = await SupplierActivity.create([data], { session: session ?? undefined });
    return created;
  },
};
