export const serializeNotification = (notification) => {
  const plain = typeof notification.toObject === 'function' ? notification.toObject() : notification;
  return {
    id: plain._id,
    channel: plain.channel,
    subject: plain.subject,
    message: plain.message,
    status: plain.status,
    sentAt: plain.sentAt,
    deliveredAt: plain.deliveredAt,
    readAt: plain.readAt,
    failureReason: plain.failureReason,
    createdAt: plain.createdAt,
  };
};

export const serializeNotificationList = (notifications) => notifications.map(serializeNotification);
