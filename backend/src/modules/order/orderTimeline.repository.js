import { OrderTimeline } from './orderTimeline.model.js';

export const orderTimelineRepository = {
  findByOrder(orderId) {
    return OrderTimeline.find({ order: orderId }).sort({ createdAt: 1 }).populate({ path: 'createdBy', select: 'name' });
  },

  async create(data, session) {
    const [created] = await OrderTimeline.create([data], { session: session ?? undefined });
    return created;
  },
};
