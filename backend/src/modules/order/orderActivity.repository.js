import { OrderActivity } from './orderActivity.model.js';

export const orderActivityRepository = {
  findByOrder(orderId) {
    return OrderActivity.find({ order: orderId }).sort({ createdAt: -1 }).populate({ path: 'performedBy', select: 'name' });
  },

  async create(data, session) {
    const [created] = await OrderActivity.create([data], { session: session ?? undefined });
    return created;
  },
};
