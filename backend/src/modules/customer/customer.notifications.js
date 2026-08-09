import { notificationSender } from '../shared/notification.sender.js';
import { customerNotificationRepository } from './customerNotification.repository.js';
import { NOTIFICATION_CHANNELS, NOTIFICATION_STATUSES } from './customer.constants.js';

// Unlike order.notifications.js (fire-and-forget, no persistence), the
// Communication Engine explicitly requires tracking Sent/Delivered/Read/
// Failed - every attempt is logged as a CustomerNotification row.
// Delivered/Read stay null in v1 (see customerNotification.model.js's
// header comment - real values need inbound provider webhooks, out of
// scope for this pass); Sent/Failed are the real, immediate send result.
export const customerNotifications = {
  async send(customer, { subject, message }) {
    const attempts = [];
    if (customer?.email) attempts.push({ channel: NOTIFICATION_CHANNELS.EMAIL, recipient: customer.email });
    if (customer?.phone) attempts.push({ channel: NOTIFICATION_CHANNELS.WHATSAPP, recipient: customer.phone });

    await Promise.all(
      attempts.map(async ({ channel, recipient }) => {
        const result =
          channel === NOTIFICATION_CHANNELS.EMAIL
            ? await notificationSender.sendEmail(recipient, subject, `<p>${message}</p>`)
            : await notificationSender.sendWhatsApp(recipient, message);

        await customerNotificationRepository.create({
          customer: customer._id,
          channel,
          subject,
          message,
          status: result.sent ? NOTIFICATION_STATUSES.SENT : NOTIFICATION_STATUSES.FAILED,
          sentAt: result.sent ? new Date() : null,
          failureReason: result.reason || '',
        });
      })
    );
  },
};
