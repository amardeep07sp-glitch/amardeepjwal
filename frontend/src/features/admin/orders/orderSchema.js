export const ORDER_STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  partially_shipped: 'Partially Shipped',
  delivered: 'Delivered',
  partially_delivered: 'Partially Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

export const ORDER_STATUS_BADGE_VARIANTS = {
  draft: 'secondary',
  pending: 'warning',
  confirmed: 'info',
  packed: 'info',
  ready_to_ship: 'info',
  shipped: 'info',
  partially_shipped: 'warning',
  delivered: 'success',
  partially_delivered: 'warning',
  completed: 'success',
  cancelled: 'destructive',
  returned: 'destructive',
  refunded: 'secondary',
};

export const PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  authorized: 'Authorized',
  paid: 'Paid',
  failed: 'Failed',
  partially_paid: 'Partially Paid',
  refunded: 'Refunded',
  partially_refunded: 'Partially Refunded',
};

export const PAYMENT_STATUS_BADGE_VARIANTS = {
  pending: 'warning',
  authorized: 'info',
  paid: 'success',
  failed: 'destructive',
  partially_paid: 'warning',
  refunded: 'secondary',
  partially_refunded: 'secondary',
};

export const RETURN_STATUS_LABELS = {
  requested: 'Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  pickup_scheduled: 'Pickup Scheduled',
  received: 'Received',
  inspected: 'Inspected',
  accepted: 'Accepted',
  restocked: 'Restocked',
};

export const RETURN_STATUS_BADGE_VARIANTS = {
  requested: 'warning',
  approved: 'info',
  rejected: 'destructive',
  pickup_scheduled: 'info',
  received: 'info',
  inspected: 'info',
  accepted: 'success',
  restocked: 'success',
};

export const REFUND_STATUS_BADGE_VARIANTS = {
  pending: 'warning',
  processing: 'info',
  completed: 'success',
  failed: 'destructive',
};

export const SHIPMENT_STATUS_BADGE_VARIANTS = {
  pending: 'warning',
  dispatched: 'info',
  in_transit: 'info',
  delivered: 'success',
  failed: 'destructive',
};

export const PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  upi: 'UPI',
  card: 'Card',
  bank_transfer: 'Bank Transfer',
  wallet: 'Wallet',
  cod: 'Cash on Delivery',
  razorpay: 'Razorpay',
};

export const ORDER_TIMELINE_LABELS = {
  created: 'Order Created',
  confirmed: 'Order Confirmed',
  paid: 'Payment Received',
  packed: 'Order Packed',
  shipped: 'Order Shipped',
  delivered: 'Order Delivered',
  cancelled: 'Order Cancelled',
  returned: 'Return Processed',
  refunded: 'Refund Issued',
  note_added: 'Note Added',
};

// Forward-only, mirrors the backend's ORDER_STATUS_TRANSITIONS exactly
// (order.constants.js) - used only to decide which action buttons render;
// the backend re-validates every transition regardless.
export const ORDER_STATUS_TRANSITIONS = {
  draft: ['pending', 'cancelled'],
  pending: ['confirmed', 'cancelled'],
  confirmed: ['packed', 'cancelled'],
  packed: ['ready_to_ship', 'cancelled'],
  ready_to_ship: ['shipped', 'cancelled'],
  shipped: ['partially_shipped', 'partially_delivered', 'delivered'],
  partially_shipped: ['shipped', 'partially_delivered', 'delivered'],
  partially_delivered: ['delivered', 'returned'],
  delivered: ['completed', 'returned'],
  completed: ['returned'],
  returned: ['refunded'],
  cancelled: [],
  refunded: [],
};
