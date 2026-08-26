import mongoose from 'mongoose';
import { MESSAGE_TYPE_VALUES, MESSAGE_TYPES, SENDER_ROLE_VALUES } from './support.constants.js';

// A ticket's messages ARE its timeline (Phase 23's "must maintain a
// complete timeline") - status/assignment/priority changes are written
// here too as `type: 'system_event'` rows, rather than a second,
// duplicate timeline collection. Phase 22's three-way split (customer /
// agent / internal note) is `senderRole` + `type` together - an
// INTERNAL_NOTE is always senderRole=AGENT, never shown to the customer
// (see ticketMessage.repository.js#findByTicket's includeInternal filter).
const ticketMessageSchema = new mongoose.Schema(
  {
    ticket: { type: mongoose.Schema.Types.ObjectId, ref: 'SupportTicket', required: true, index: true },
    senderId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    senderRole: { type: String, enum: SENDER_ROLE_VALUES, required: true },
    type: { type: String, enum: MESSAGE_TYPE_VALUES, default: MESSAGE_TYPES.MESSAGE },
    content: { type: String, required: true, trim: true },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    readAt: { type: Date, default: null },
  },
  { timestamps: true }
);

ticketMessageSchema.index({ ticket: 1, createdAt: 1 });

export const TicketMessage = mongoose.model('TicketMessage', ticketMessageSchema);
