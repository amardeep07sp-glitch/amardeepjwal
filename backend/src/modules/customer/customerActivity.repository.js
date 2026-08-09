import { CustomerActivity } from './customerActivity.model.js';

export const customerActivityRepository = {
  findByCustomer(customerId) {
    return CustomerActivity.find({ customer: customerId }).sort({ createdAt: -1 }).populate({ path: 'performedBy', select: 'name' });
  },

  async create(data, session) {
    const [created] = await CustomerActivity.create([data], { session: session ?? undefined });
    return created;
  },
};
