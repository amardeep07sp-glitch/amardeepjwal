import mongoose from 'mongoose';
import { BROADCAST_CHANNEL_VALUES, BROADCAST_STATUS_VALUES, BROADCAST_STATUSES } from './broadcast.constants.js';

// One row per admin "send to everyone" action, across all three channels at
// once. `stats` is the running/final tally of the async fan-out
// (broadcast.service.js#processBroadcast) - polled by the admin compose
// page instead of the request blocking on however long it takes to email +
// WhatsApp every customer. `channels` including 'website' makes this row
// itself the on-site banner's content until `isActive` is turned off or
// `expiresAt` passes (see broadcast.repository.js#findActiveWebsite) - no
// separate "announcement" entity needed.
const broadcastStatsSchema = new mongoose.Schema(
  {
    totalRecipients: { type: Number, default: 0 },
    emailSent: { type: Number, default: 0 },
    emailFailed: { type: Number, default: 0 },
    emailSkipped: { type: Number, default: 0 },
    whatsappSent: { type: Number, default: 0 },
    whatsappFailed: { type: Number, default: 0 },
    whatsappSkipped: { type: Number, default: 0 },
  },
  { _id: false }
);

const broadcastSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    message: { type: String, required: true, trim: true },
    channels: {
      type: [{ type: String, enum: BROADCAST_CHANNEL_VALUES }],
      validate: { validator: (v) => Array.isArray(v) && v.length > 0, message: 'Select at least one channel' },
    },
    status: { type: String, enum: BROADCAST_STATUS_VALUES, default: BROADCAST_STATUSES.PENDING, index: true },
    stats: { type: broadcastStatsSchema, default: () => ({}) },

    // Only meaningful for the 'website' channel - the on-site banner is
    // shown while isActive is true and (expiresAt is null or in the
    // future). Admin can flip isActive off early without waiting for
    // expiresAt (see broadcast.service.js#deactivateBroadcast).
    isActive: { type: Boolean, default: true },
    expiresAt: { type: Date, default: null },

    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    failureReason: { type: String, trim: true, default: '' },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

broadcastSchema.index({ createdAt: -1 });
broadcastSchema.index({ channels: 1, isActive: 1, expiresAt: 1 });

export const Broadcast = mongoose.model('Broadcast', broadcastSchema);
