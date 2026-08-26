import { ApiError } from '../../utils/ApiError.js';
import { supportTicketRepository } from './supportTicket.repository.js';
import { ticketMessageRepository } from './ticketMessage.repository.js';
import { supportNumbering } from '../shared/support.numbering.js';
import { supportTicketNotifications } from './supportTicket.notifications.js';
import { slaService } from './sla.service.js';
import { assignmentService } from './assignment.service.js';
import { customerRepository } from '../customer/customer.repository.js';
import { activityLogService } from '../activityLog/activityLog.service.js';
import { uploadAttachments } from '../shared/attachmentUpload.util.js';
import { MEDIA_ENTITY_TYPES } from '../media/media.constants.js';
import {
  TICKET_STATUSES,
  TICKET_STATUS_TRANSITIONS,
  MESSAGE_TYPES,
  SENDER_ROLES,
  TICKET_DUPLICATE_WINDOW_HOURS,
} from './support.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Best-effort notify - a delivery failure must never fail the actual
// ticket/message operation (same discipline as activityLogService.record).
async function notifyCustomerSafely(customerId, fn) {
  try {
    const customer = await customerRepository.findRawById(customerId);
    if (customer) await fn(customer);
  } catch {
    // notification failure is never fatal to the underlying support action
  }
}

export const supportService = {
  // ---- Creation ----
  // `context` carries whatever the Context Engine (Phase 50) auto-resolved
  // on the frontend (orderId/productId/paymentId/etc) - the customer never
  // re-types information the platform already has (Phase 53). Returns
  // { ticket, isDuplicate } - Phase 32's dedup check (see
  // supportTicket.repository.js#findRecentDuplicate) returns the EXISTING
  // ticket instead of creating a new one for the same order+category
  // within the window.
  async createTicket({ customerId, subject, category, priority, source, context, message, attachmentFiles }, actorUserId) {
    const sinceDate = new Date(Date.now() - TICKET_DUPLICATE_WINDOW_HOURS * 3600000);
    const duplicate = await supportTicketRepository.findRecentDuplicate({ customerId, category, orderId: context?.orderId, sinceDate });
    if (duplicate) {
      return { ticket: await supportTicketRepository.findById(duplicate._id), isDuplicate: true };
    }

    const ticketNumber = await supportNumbering.getNextTicketNumber();
    const now = new Date();
    const [{ firstResponseDueAt, resolutionDueAt }, autoAssignedAgentId] = await Promise.all([
      slaService.computeDeadlines(priority, now),
      assignmentService.resolveAgentForCategory(category),
    ]);
    const ticket = await supportTicketRepository.create({
      ticketNumber,
      customer: customerId,
      subject,
      category,
      priority,
      // Phase 25 - a category with an active routing rule starts life
      // already assigned and IN_PROGRESS, same state assignTicket() would
      // put it in manually; a category with no rule falls back to today's
      // plain OPEN/unassigned behavior.
      status: autoAssignedAgentId ? TICKET_STATUSES.IN_PROGRESS : TICKET_STATUSES.OPEN,
      assignedAgentId: autoAssignedAgentId,
      source,
      context: context ?? {},
      firstResponseDueAt,
      resolutionDueAt,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    if (autoAssignedAgentId) {
      await activityLogService.record({ module: 'support', action: 'ticket.auto_assigned', entityId: ticket._id, entityName: ticketNumber, performedBy: null, metadata: { agentUserId: autoAssignedAgentId } });
    }

    if (message) {
      const attachments = await uploadAttachments(attachmentFiles, MEDIA_ENTITY_TYPES.SUPPORT_TICKET, ticket._id, actorUserId);
      await ticketMessageRepository.create({
        ticket: ticket._id,
        senderId: actorUserId,
        senderRole: SENDER_ROLES.CUSTOMER,
        type: MESSAGE_TYPES.MESSAGE,
        content: message,
        attachments,
      });
    }

    await activityLogService.record({ module: 'support', action: 'ticket.created', entityId: ticket._id, entityName: ticketNumber, performedBy: actorUserId });
    await notifyCustomerSafely(customerId, (customer) => supportTicketNotifications.notifyCreated(customer, ticket));

    return { ticket, isDuplicate: false };
  },

  // ---- Staff queue ----
  async listTickets(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await supportTicketRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getTicketById(id) {
    const ticket = await supportTicketRepository.findById(id);
    if (!ticket) throw new ApiError(404, 'Support ticket not found');
    return ticket;
  },

  getDashboardCounts() {
    return supportTicketRepository.getDashboardCounts();
  },

  listMessages(ticketId, { includeInternal = true } = {}) {
    return ticketMessageRepository.findByTicket(ticketId, { includeInternal });
  },

  async assignTicket(ticketId, agentUserId, actorUserId) {
    const ticket = await supportTicketRepository.findRawById(ticketId);
    if (!ticket) throw new ApiError(404, 'Support ticket not found');

    ticket.assignedAgentId = agentUserId;
    if (ticket.status === TICKET_STATUSES.OPEN) ticket.status = TICKET_STATUSES.IN_PROGRESS;
    ticket.updatedBy = actorUserId;
    await ticket.save();

    await ticketMessageRepository.create({
      ticket: ticket._id,
      senderId: actorUserId,
      senderRole: SENDER_ROLES.SYSTEM,
      type: MESSAGE_TYPES.SYSTEM_EVENT,
      content: agentUserId ? 'Ticket assigned to an agent.' : 'Ticket unassigned.',
    });
    await activityLogService.record({ module: 'support', action: 'ticket.assigned', entityId: ticket._id, entityName: ticket.ticketNumber, performedBy: actorUserId, metadata: { agentUserId } });

    return supportTicketRepository.findById(ticketId);
  },

  async updatePriority(ticketId, priority, actorUserId) {
    const ticket = await supportTicketRepository.findRawById(ticketId);
    if (!ticket) throw new ApiError(404, 'Support ticket not found');

    const oldPriority = ticket.priority;
    ticket.priority = priority;
    ticket.updatedBy = actorUserId;

    // Recomputed from the ticket's real createdAt (not "now") - escalating
    // priority tightens the deadline relative to when it actually arrived,
    // it doesn't grant a fresh SLA window starting from the escalation.
    const { firstResponseDueAt, resolutionDueAt } = await slaService.computeDeadlines(priority, ticket.createdAt);
    ticket.firstResponseDueAt = firstResponseDueAt;
    ticket.resolutionDueAt = resolutionDueAt;
    await ticket.save();

    await activityLogService.record({ module: 'support', action: 'ticket.priority_changed', entityId: ticket._id, entityName: ticket.ticketNumber, performedBy: actorUserId, metadata: { oldPriority, newPriority: priority } });
    return supportTicketRepository.findById(ticketId);
  },

  async updateStatus(ticketId, status, actorUserId, { note } = {}) {
    const ticket = await supportTicketRepository.findRawById(ticketId);
    if (!ticket) throw new ApiError(404, 'Support ticket not found');

    const allowed = TICKET_STATUS_TRANSITIONS[ticket.status] ?? [];
    if (!allowed.includes(status)) {
      throw new ApiError(400, `Cannot move a ticket from "${ticket.status}" to "${status}"`);
    }

    const oldStatus = ticket.status;
    ticket.status = status;
    ticket.updatedBy = actorUserId;
    if (status === TICKET_STATUSES.RESOLVED) ticket.resolvedAt = new Date();
    if (status === TICKET_STATUSES.CLOSED) ticket.closedAt = new Date();
    await ticket.save();

    await ticketMessageRepository.create({
      ticket: ticket._id,
      senderId: actorUserId,
      senderRole: SENDER_ROLES.SYSTEM,
      type: MESSAGE_TYPES.SYSTEM_EVENT,
      content: note || `Status changed from "${oldStatus}" to "${status}".`,
    });
    await activityLogService.record({ module: 'support', action: 'ticket.status_changed', entityId: ticket._id, entityName: ticket.ticketNumber, performedBy: actorUserId, metadata: { oldStatus, newStatus: status } });
    await notifyCustomerSafely(ticket.customer, (customer) => supportTicketNotifications.notifyStatusChanged(customer, ticket, status));

    return supportTicketRepository.findById(ticketId);
  },

  // Agents can post a real reply OR an internal note (never shown to the
  // customer) - both go through this one method, discriminated by `type`.
  async addAgentMessage(ticketId, { content, type, attachmentFiles }, actorUserId) {
    const ticket = await supportTicketRepository.findRawById(ticketId);
    if (!ticket) throw new ApiError(404, 'Support ticket not found');

    const attachments = await uploadAttachments(attachmentFiles, MEDIA_ENTITY_TYPES.SUPPORT_TICKET, ticket._id, actorUserId);
    const message = await ticketMessageRepository.create({
      ticket: ticket._id,
      senderId: actorUserId,
      senderRole: SENDER_ROLES.AGENT,
      type: type === MESSAGE_TYPES.INTERNAL_NOTE ? MESSAGE_TYPES.INTERNAL_NOTE : MESSAGE_TYPES.MESSAGE,
      content,
      attachments,
    });

    // A real customer-visible reply is the only thing that moves the
    // ticket forward automatically - an internal note is staff-only
    // bookkeeping and shouldn't change what the customer sees.
    if (message.type === MESSAGE_TYPES.MESSAGE) {
      if (!ticket.firstResponseAt) ticket.firstResponseAt = new Date();
      if ([TICKET_STATUSES.OPEN, TICKET_STATUSES.IN_PROGRESS].includes(ticket.status)) ticket.status = TICKET_STATUSES.WAITING_FOR_CUSTOMER;
      ticket.updatedBy = actorUserId;
      await ticket.save();
      await notifyCustomerSafely(ticket.customer, (customer) => supportTicketNotifications.notifyAgentReplied(customer, ticket));
    }

    await activityLogService.record({ module: 'support', action: `ticket.${message.type}_added`, entityId: ticket._id, entityName: ticket.ticketNumber, performedBy: actorUserId });
    return message;
  },

  // ---- Customer-scoped (called from storefront passthrough) ----
  async listMyTickets(customerId, query) {
    const { page, limit, status } = query;
    const { items, total } = await supportTicketRepository.findPaginated({ page, limit, status, customerId });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getMyTicket(customerId, ticketId) {
    const ticket = await supportTicketRepository.findById(ticketId);
    if (!ticket || String(ticket.customer.id ?? ticket.customer._id) !== String(customerId)) {
      throw new ApiError(404, 'Support ticket not found');
    }
    return ticket;
  },

  async addMyMessage(customerId, ticketId, { content, attachmentFiles }, actorUserId) {
    const ticket = await supportTicketRepository.findRawById(ticketId);
    if (!ticket || String(ticket.customer) !== String(customerId)) throw new ApiError(404, 'Support ticket not found');
    if (ticket.status === TICKET_STATUSES.CLOSED) throw new ApiError(400, 'This ticket is closed. Please raise a new ticket.');

    const attachments = await uploadAttachments(attachmentFiles, MEDIA_ENTITY_TYPES.SUPPORT_TICKET, ticket._id, actorUserId);
    const message = await ticketMessageRepository.create({
      ticket: ticket._id,
      senderId: actorUserId,
      senderRole: SENDER_ROLES.CUSTOMER,
      type: MESSAGE_TYPES.MESSAGE,
      content,
      attachments,
    });

    // A customer reply always brings the ticket back into the active queue
    // - never left sitting in WAITING_FOR_CUSTOMER once they've actually
    // responded.
    if ([TICKET_STATUSES.WAITING_FOR_CUSTOMER, TICKET_STATUSES.RESOLVED].includes(ticket.status)) {
      ticket.status = TICKET_STATUSES.IN_PROGRESS;
      ticket.updatedBy = actorUserId;
      await ticket.save();
    }

    await activityLogService.record({ module: 'support', action: 'ticket.customer_replied', entityId: ticket._id, entityName: ticket.ticketNumber, performedBy: actorUserId });
    return message;
  },
};
