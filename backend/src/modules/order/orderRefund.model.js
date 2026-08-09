import mongoose from 'mongoose';
import { REFUND_TYPES, REFUND_STATUSES } from './order.constants.js';

const orderRefundSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    // Nullable - a refund can stand alone (e.g. cancelling a paid order)
    // or trace back to the OrderReturn that produced it.
    return: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderReturn', default: null },
    type: { type: String, enum: Object.values(REFUND_TYPES), required: true },
    amount: { type: Number, required: true, min: 0 },
    method: { type: String, trim: true, default: '' },
    status: { type: String, enum: Object.values(REFUND_STATUSES), default: REFUND_STATUSES.PENDING, index: true },
    refundReference: { type: String, trim: true, default: '' },
    processedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const OrderRefund = mongoose.model('OrderRefund', orderRefundSchema);
