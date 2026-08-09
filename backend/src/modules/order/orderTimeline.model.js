import mongoose from 'mongoose';
import { ORDER_TIMELINE_EVENTS } from './order.constants.js';

// Customer-facing milestone feed - append-only, same structural-immutability
// convention as InventoryMovement (no update/delete repository methods).
const orderTimelineSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    event: { type: String, enum: Object.values(ORDER_TIMELINE_EVENTS), required: true },
    note: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const OrderTimeline = mongoose.model('OrderTimeline', orderTimelineSchema);
