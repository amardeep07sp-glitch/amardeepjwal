import mongoose from 'mongoose';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from './customer.constants.js';

// One row per send attempt - the Communication Engine's audit trail
// ("every communication must be auditable", Phase 8 spec). Delivered/Read
// are schema-ready but not wired to real provider webhooks in v1 (see
// customer.notifications.js) - Sent/Failed are the real, immediate result
// of the API call.
const customerNotificationSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    channel: { type: String, enum: Object.values(NOTIFICATION_CHANNELS), required: true },
    subject: { type: String, trim: true, default: '' },
    message: { type: String, trim: true, default: '' },
    status: { type: String, enum: Object.values(NOTIFICATION_STATUSES), default: NOTIFICATION_STATUSES.SENT },
    sentAt: { type: Date, default: null },
    deliveredAt: { type: Date, default: null },
    readAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

customerNotificationSchema.index({ customer: 1, createdAt: -1 });

export const CustomerNotification = mongoose.model('CustomerNotification', customerNotificationSchema);
