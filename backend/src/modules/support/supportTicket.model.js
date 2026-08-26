import mongoose from 'mongoose';
import {
  TICKET_CATEGORY_VALUES,
  TICKET_CATEGORIES,
  TICKET_PRIORITY_VALUES,
  TICKET_PRIORITIES,
  TICKET_STATUS_VALUES,
  TICKET_STATUSES,
  TICKET_SOURCE_VALUES,
  TICKET_SOURCES,
} from './support.constants.js';

// The Context Engine (Phase 50/53) made real: whichever entity the customer
// was looking at when they clicked "Get Support" is captured here
// automatically - `extra` is a free-form snapshot (e.g. cart subtotal,
// applied coupon code, gateway error code) for whatever a given category
// needs that doesn't warrant its own first-class ref field.
const ticketContextSchema = new mongoose.Schema(
  {
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', default: null },
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null },
    paymentId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderPayment', default: null },
    returnId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderReturn', default: null },
    refundId: { type: mongoose.Schema.Types.ObjectId, ref: 'OrderRefund', default: null },
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    extra: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { _id: false }
);

const supportTicketSchema = new mongoose.Schema(
  {
    ticketNumber: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    subject: { type: String, required: true, trim: true },
    category: { type: String, enum: TICKET_CATEGORY_VALUES, default: TICKET_CATEGORIES.OTHER },
    priority: { type: String, enum: TICKET_PRIORITY_VALUES, default: TICKET_PRIORITIES.MEDIUM },
    status: { type: String, enum: TICKET_STATUS_VALUES, default: TICKET_STATUSES.OPEN, index: true },
    source: { type: String, enum: TICKET_SOURCE_VALUES, default: TICKET_SOURCES.WEB },

    context: { type: ticketContextSchema, default: () => ({}) },

    assignedAgentId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },

    firstResponseAt: { type: Date, default: null },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },

    // SLA Engine (Phase 26/58) - deadlines computed from the CURRENT
    // priority's policy at creation time and recomputed (from createdAt,
    // not "now") whenever priority changes, so escalating a ticket
    // tightens its deadline the same way a real support desk's would.
    // Calendar-time only, no business-hours awareness (spec explicitly
    // allows deferring that). `slaBreached` is an orthogonal flag, not a
    // workflow status - a breached ticket can still be legitimately
    // OPEN/IN_PROGRESS; it just also needs escalation attention.
    firstResponseDueAt: { type: Date, default: null },
    resolutionDueAt: { type: Date, default: null },
    slaBreached: { type: Boolean, default: false, index: true },
    slaBreachedAt: { type: Date, default: null },

    // Both customer-initiated and staff-initiated tickets go through the
    // same auth/User system in this codebase (a Customer's `user` ref IS a
    // real User row) - createdBy is always a real User id either way, never
    // a separate "customer id" concept.
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

supportTicketSchema.index({ status: 1, priority: 1, createdAt: -1 });
supportTicketSchema.index({ customer: 1, createdAt: -1 });

export const SupportTicket = mongoose.model('SupportTicket', supportTicketSchema);
