import { TicketMessage } from './ticketMessage.model.js';
import { MESSAGE_TYPES } from './support.constants.js';

const SENDER_POPULATE = { path: 'senderId', select: 'name role' };

export const ticketMessageRepository = {
  create(data) {
    return TicketMessage.create(data).then((m) => m.populate([SENDER_POPULATE, 'attachments']));
  },

  // `includeInternal: false` is the customer-facing read - internal notes
  // must never reach that response (Phase 22's explicit rule).
  findByTicket(ticketId, { includeInternal = true } = {}) {
    const filter = { ticket: ticketId };
    if (!includeInternal) filter.type = { $ne: MESSAGE_TYPES.INTERNAL_NOTE };
    return TicketMessage.find(filter).sort({ createdAt: 1 }).populate(SENDER_POPULATE).populate('attachments');
  },

  countByTicket(ticketId) {
    return TicketMessage.countDocuments({ ticket: ticketId, type: MESSAGE_TYPES.MESSAGE });
  },

  markReadByCustomer(ticketId) {
    return TicketMessage.updateMany({ ticket: ticketId, senderRole: 'agent', readAt: null }, { $set: { readAt: new Date() } });
  },
};
