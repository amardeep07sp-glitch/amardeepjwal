import { OrderReturn } from './orderReturn.model.js';

const POPULATE_FIELDS = [{ path: 'order', select: 'orderNumber customer' }];

export const orderReturnRepository = {
  async findPaginated({ page, limit, status }) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      OrderReturn.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
      OrderReturn.countDocuments(filter),
    ]);

    return { items, total };
  },

  findByOrder(orderId) {
    return OrderReturn.find({ order: orderId }).sort({ createdAt: -1 });
  },

  findById(id, session) {
    return OrderReturn.findById(id).session(session ?? null);
  },

  async create(data, session) {
    const [created] = await OrderReturn.create([data], { session: session ?? undefined });
    return created;
  },

  updateById(id, data, session) {
    return OrderReturn.findByIdAndUpdate(id, data, { new: true, session: session ?? undefined });
  },
};
