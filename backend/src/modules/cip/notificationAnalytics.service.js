import { CustomerNotification } from '../customer/customerNotification.model.js';

// Reads the Communication Engine's own audit trail (Phase 8's
// CustomerNotification - already tracks Sent/Delivered/Read/Failed per
// channel) rather than standing up a second notification-tracking
// collection. "Push (future)" needs no plumbing yet - NOTIFICATION_CHANNELS
// only defines email/whatsapp today; adding 'push' there is all a future
// phase needs to do for this report to include it automatically.
export const notificationAnalyticsService = {
  async getNotificationReport({ dateFrom, dateTo } = {}) {
    const match = {};
    if (dateFrom || dateTo) {
      match.createdAt = {};
      if (dateFrom) match.createdAt.$gte = new Date(dateFrom);
      if (dateTo) match.createdAt.$lte = new Date(dateTo);
    }

    const rows = await CustomerNotification.aggregate([
      { $match: match },
      { $group: { _id: { channel: '$channel', status: '$status' }, count: { $sum: 1 } } },
    ]);

    const byChannel = {};
    for (const row of rows) {
      const { channel, status } = row._id;
      byChannel[channel] ??= { sent: 0, delivered: 0, read: 0, failed: 0 };
      byChannel[channel][status] = row.count;
    }
    return byChannel;
  },
};
