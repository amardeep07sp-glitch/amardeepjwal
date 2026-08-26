import { customerNotifications } from '../customer/customer.notifications.js';

// Same persisted-notification-log reuse as supportTicket.notifications.js
// (Phase 27 - don't build a second notification system) - issue reports
// previously sent nothing at all on status change, unlike support tickets.
export const issueReportNotifications = {
  notifyStatusChanged(customer, issue, status) {
    const STATUS_COPY = {
      under_review: `Your reported issue ${issue.issueNumber} is now under review by our team.`,
      in_progress: `We're actively working on your reported issue ${issue.issueNumber}.`,
      waiting_for_customer: `We need more information from you on issue ${issue.issueNumber}. Please check your account and reply.`,
      resolved: `Your reported issue ${issue.issueNumber} has been resolved.`,
      rejected: `We've reviewed your reported issue ${issue.issueNumber} and won't be taking further action on it.`,
      closed: `Your reported issue ${issue.issueNumber} has been closed.`,
    };
    const message = STATUS_COPY[status];
    if (!message) return Promise.resolve();
    return customerNotifications.send(customer, { subject: `Update on your report ${issue.issueNumber}`, message });
  },
};
