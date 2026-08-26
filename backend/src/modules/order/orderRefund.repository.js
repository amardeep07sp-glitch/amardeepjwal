import mongoose from 'mongoose';
import { OrderRefund } from './orderRefund.model.js';
import { REFUND_STATUSES } from './order.constants.js';

const POPULATE_FIELDS = [{ path: 'order', select: 'orderNumber customer' }];

export const orderRefundRepository = {
  async findPaginated({ page, limit, status }) {
    const filter = {};
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      OrderRefund.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
      OrderRefund.countDocuments(filter),
    ]);

    return { items, total };
  },

  findByOrder(orderId) {
    return OrderRefund.find({ order: orderId }).sort({ createdAt: -1 });
  },

  findById(id, session) {
    return OrderRefund.findById(id).session(session ?? null);
  },

  async create(data, session) {
    const [created] = await OrderRefund.create([data], { session: session ?? undefined });
    return created;
  },

  updateById(id, data, session) {
    return OrderRefund.findByIdAndUpdate(id, data, { new: true, session: session ?? undefined });
  },

  // Phase 59 automation sweep candidates - still PENDING/PROCESSING past
  // the given cutoff (the sweep decides how "stale" means, see
  // supportAutomation.service.js).
  findStalePending(cutoffDate) {
    return OrderRefund.find({
      status: { $in: [REFUND_STATUSES.PENDING, REFUND_STATUSES.PROCESSING] },
      createdAt: { $lt: cutoffDate },
    }).populate(POPULATE_FIELDS);
  },

  // Same explicit-cast requirement as orderPayment.repository.js#sumPaidByOrder
  // - aggregate()'s $match does not auto-cast strings to ObjectId.
  async sumCompletedByOrder(orderId, session) {
    const [row] = await OrderRefund.aggregate([
      { $match: { order: new mongoose.Types.ObjectId(orderId), status: 'completed' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).session(session ?? null);
    return row?.total ?? 0;
  },
};
