import { notificationSender } from '../shared/notification.sender.js';

// Order's own message copy/templates - the actual sending mechanics live in
// shared/notification.sender.js (Resend + WhatsApp), reused by
// customer/customer.notifications.js too as of Phase 8.
const NOTIFICATION_COPY = {
  confirmed: (order) => `Your order ${order.orderNumber} has been confirmed.`,
  paid: (order) => `Payment received for order ${order.orderNumber}.`,
  packed: (order) => `Your order ${order.orderNumber} has been packed and is ready to ship.`,
  shipped: (order) => `Your order ${order.orderNumber} has shipped.`,
  delivered: (order) => `Your order ${order.orderNumber} has been delivered.`,
  cancelled: (order) => `Your order ${order.orderNumber} has been cancelled.`,
  refunded: (order) => `A refund has been processed for order ${order.orderNumber}.`,
};

export const orderNotifications = {
  // `event` matches ORDER_TIMELINE_EVENTS - unknown events are silently
  // ignored (no copy defined) rather than throwing, so new timeline events
  // can be added without this file also needing an update in lockstep.
  async notify(event, order, customer) {
    const buildMessage = NOTIFICATION_COPY[event];
    if (!buildMessage) return;
    const message = buildMessage(order);

    await Promise.all([
      notificationSender.sendEmail(customer?.email, `Order ${order.orderNumber} update`, `<p>${message}</p>`),
      notificationSender.sendWhatsApp(customer?.phone, message),
    ]);
  },
};
