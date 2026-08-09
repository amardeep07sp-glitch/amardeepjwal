import { CustomerTimeline } from './customerTimeline.model.js';

export const customerTimelineRepository = {
  findByCustomer(customerId) {
    return CustomerTimeline.find({ customer: customerId }).sort({ createdAt: 1 }).populate({ path: 'createdBy', select: 'name' });
  },

  async create(data, session) {
    const [created] = await CustomerTimeline.create([data], { session: session ?? undefined });
    return created;
  },
};
