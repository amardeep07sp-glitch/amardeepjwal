import mongoose from 'mongoose';

// Internal audit feed - who did what, old value -> new value, why, and from
// where. Append-only, distinct from the generic cross-module ActivityLog
// (see order.audit.js): this one carries the IP/UA/old-new fields the
// Phase 7 spec calls out specifically for Orders.
const orderActivitySchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    action: { type: String, required: true, trim: true },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    reason: { type: String, trim: true, default: '' },
    ipAddress: { type: String, trim: true, default: '' },
    userAgent: { type: String, trim: true, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const OrderActivity = mongoose.model('OrderActivity', orderActivitySchema);
