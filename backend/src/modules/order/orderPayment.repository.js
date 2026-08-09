import mongoose from 'mongoose';
import { OrderPayment } from './orderPayment.model.js';

export const orderPaymentRepository = {
  findByOrder(orderId) {
    return OrderPayment.find({ order: orderId }).sort({ createdAt: -1 });
  },

  findById(id, session) {
    return OrderPayment.findById(id).session(session ?? null);
  },

  findByGatewayPaymentId(gatewayPaymentId, session) {
    return OrderPayment.findOne({ gatewayPaymentId }).session(session ?? null);
  },

  findByGatewayOrderId(gatewayOrderId, session) {
    return OrderPayment.findOne({ gatewayOrderId }).session(session ?? null);
  },

  async create(data, session) {
    const [created] = await OrderPayment.create([data], { session: session ?? undefined });
    return created;
  },

  updateById(id, data, session) {
    return OrderPayment.findByIdAndUpdate(id, data, { new: true, session: session ?? undefined });
  },

  // Aggregate's $match does NOT get Mongoose's automatic string->ObjectId
  // query casting the way find()/findOne() do - orderId must be cast
  // explicitly here, or this silently matches zero documents.
  async sumPaidByOrder(orderId, session) {
    const [row] = await OrderPayment.aggregate([
      { $match: { order: new mongoose.Types.ObjectId(orderId), status: 'paid' } },
      { $group: { _id: null, total: { $sum: '$amount' } } },
    ]).session(session ?? null);
    return row?.total ?? 0;
  },
};
