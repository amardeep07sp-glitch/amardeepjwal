import mongoose from 'mongoose';
import { RETURN_STATUSES } from './order.constants.js';

const returnItemSchema = new mongoose.Schema(
  {
    orderItem: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderItem', required: true },
    returnQuantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const orderReturnSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    items: { type: [returnItemSchema], default: [] },
    reason: { type: String, trim: true, default: '' },
    status: { type: String, enum: Object.values(RETURN_STATUSES), default: RETURN_STATUSES.REQUESTED, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const OrderReturn = mongoose.model('OrderReturn', orderReturnSchema);
