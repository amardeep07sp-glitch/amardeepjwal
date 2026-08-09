import { SupplierLedger } from './supplierLedger.model.js';

export const supplierLedgerRepository = {
  async findPaginatedBySupplier(supplierId, { page, limit }) {
    const filter = { supplier: supplierId };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      SupplierLedger.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit).populate({ path: 'performedBy', select: 'name' }),
      SupplierLedger.countDocuments(filter),
    ]);
    return { items, total };
  },

  async create(data, session) {
    const [created] = await SupplierLedger.create([data], { session: session ?? undefined });
    return created;
  },
};
