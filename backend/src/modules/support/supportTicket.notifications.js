import { customerNotifications } from '../customer/customer.notifications.js';

// Reuses the Customer module's persisted notification log (Phase 27 -
// "reuse existing notification architecture, don't build a second one")
// rather than order.notifications.js's fire-and-forget version, since a
// support conversation benefits from the same auditable delivery record
// customer.notifications.js already gives every other Customer-facing
// message.
export const supportTicketNotifications = {
  notifyCreated(customer, ticket) {
    return customerNotifications.send(customer, {
      subject: `We've received your request - ${ticket.ticketNumber}`,
      message: `Thanks for reaching out. Your support ticket ${ticket.ticketNumber} ("${ticket.subject}") has been created and our team will respond shortly.`,
    });
  },

  notifyAgentReplied(customer, ticket) {
    return customerNotifications.send(customer, {
      subject: `New reply on your ticket ${ticket.ticketNumber}`,
      message: `You have a new reply on your support ticket ${ticket.ticketNumber} ("${ticket.subject}"). Please check your account to view it.`,
    });
  },

  notifyStatusChanged(customer, ticket, status) {
    const STATUS_COPY = {
      resolved: `Your support ticket ${ticket.ticketNumber} has been marked as resolved. If this didn't fully solve your issue, just reply and we'll reopen it.`,
      closed: `Your support ticket ${ticket.ticketNumber} has been closed.`,
      waiting_for_customer: `We're waiting on more information from you for ticket ${ticket.ticketNumber}. Please reply when you can.`,
    };
    const message = STATUS_COPY[status];
    if (!message) return Promise.resolve();
    return customerNotifications.send(customer, { subject: `Update on your ticket ${ticket.ticketNumber}`, message });
  },
};
