import { SupplierTimeline } from './supplierTimeline.model.js';

export const supplierTimelineRepository = {
  findBySupplier(supplierId) {
    return SupplierTimeline.find({ supplier: supplierId }).sort({ createdAt: 1 }).populate({ path: 'createdBy', select: 'name' });
  },

  async create(data, session) {
    const [created] = await SupplierTimeline.create([data], { session: session ?? undefined });
    return created;
  },
};
