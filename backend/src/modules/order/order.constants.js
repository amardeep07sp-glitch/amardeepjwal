export const ORDER_STATUSES = Object.freeze({
  DRAFT: 'draft',
  PENDING: 'pending',
  CONFIRMED: 'confirmed',
  PACKED: 'packed',
  READY_TO_SHIP: 'ready_to_ship',
  SHIPPED: 'shipped',
  PARTIALLY_SHIPPED: 'partially_shipped',
  DELIVERED: 'delivered',
  PARTIALLY_DELIVERED: 'partially_delivered',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
});

// Distinct from orderStatus per spec - orderStatus is the overall lifecycle
// stage, fulfillmentStatus is specifically "how much of this order has
// shipped", derived from OrderItem statuses.
export const FULFILLMENT_STATUSES = Object.freeze({
  UNFULFILLED: 'unfulfilled',
  PARTIALLY_FULFILLED: 'partially_fulfilled',
  FULFILLED: 'fulfilled',
});

export const PAYMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  AUTHORIZED: 'authorized',
  PAID: 'paid',
  FAILED: 'failed',
  PARTIALLY_PAID: 'partially_paid',
  REFUNDED: 'refunded',
  PARTIALLY_REFUNDED: 'partially_refunded',
});

// Item-level status - enables partial shipment/delivery without needing a
// separate collection just to track "which items of this order are where".
export const ORDER_ITEM_STATUSES = Object.freeze({
  PENDING: 'pending',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
});

export const PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  UPI: 'upi',
  CARD: 'card',
  BANK_TRANSFER: 'bank_transfer',
  WALLET: 'wallet',
  COD: 'cod',
  RAZORPAY: 'razorpay',
});

export const SHIPMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  DISPATCHED: 'dispatched',
  IN_TRANSIT: 'in_transit',
  DELIVERED: 'delivered',
  FAILED: 'failed',
});

export const RETURN_STATUSES = Object.freeze({
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  PICKUP_SCHEDULED: 'pickup_scheduled',
  RECEIVED: 'received',
  INSPECTED: 'inspected',
  ACCEPTED: 'accepted',
  RESTOCKED: 'restocked',
});

// Forward-only, linear (returns don't branch the way orders do, aside from
// the two reject points) - checked by orderReturn.service.js the same way
// order.statusTransition.js checks ORDER_STATUS_TRANSITIONS.
export const RETURN_STATUS_TRANSITIONS = Object.freeze({
  [RETURN_STATUSES.REQUESTED]: [RETURN_STATUSES.APPROVED, RETURN_STATUSES.REJECTED],
  [RETURN_STATUSES.APPROVED]: [RETURN_STATUSES.PICKUP_SCHEDULED],
  [RETURN_STATUSES.PICKUP_SCHEDULED]: [RETURN_STATUSES.RECEIVED],
  [RETURN_STATUSES.RECEIVED]: [RETURN_STATUSES.INSPECTED],
  [RETURN_STATUSES.INSPECTED]: [RETURN_STATUSES.ACCEPTED, RETURN_STATUSES.REJECTED],
  [RETURN_STATUSES.ACCEPTED]: [RETURN_STATUSES.RESTOCKED],
  [RETURN_STATUSES.RESTOCKED]: [],
  [RETURN_STATUSES.REJECTED]: [],
});

export const REFUND_TYPES = Object.freeze({
  FULL: 'full',
  PARTIAL: 'partial',
});

export const REFUND_STATUSES = Object.freeze({
  PENDING: 'pending',
  PROCESSING: 'processing',
  COMPLETED: 'completed',
  FAILED: 'failed',
});

export const ORDER_SOURCES = Object.freeze({
  WEBSITE: 'website',
  ADMIN: 'admin',
  POS: 'pos',
  MOBILE: 'mobile',
});

export const ORDER_TIMELINE_EVENTS = Object.freeze({
  CREATED: 'created',
  CONFIRMED: 'confirmed',
  PAID: 'paid',
  PACKED: 'packed',
  SHIPPED: 'shipped',
  DELIVERED: 'delivered',
  CANCELLED: 'cancelled',
  RETURNED: 'returned',
  REFUNDED: 'refunded',
  NOTE_ADDED: 'note_added',
});

// Forward-only per-status transition map - order.statusTransition.js's
// canTransition() is the single place this is consulted. Adding a new
// status later means adding one row here, not auditing every call site.
export const ORDER_STATUS_TRANSITIONS = Object.freeze({
  [ORDER_STATUSES.DRAFT]: [ORDER_STATUSES.PENDING, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.PENDING]: [ORDER_STATUSES.CONFIRMED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.CONFIRMED]: [ORDER_STATUSES.PACKED, ORDER_STATUSES.CANCELLED],
  // Ready To Ship is an optional manual staging step, not a mandatory gate -
  // orderShipment.service.js#createShipment can dispatch straight from
  // Packed (the common case) or from Ready To Ship (if that staging step
  // was used), so both must be reachable targets here.
  [ORDER_STATUSES.PACKED]: [
    ORDER_STATUSES.READY_TO_SHIP,
    ORDER_STATUSES.SHIPPED,
    ORDER_STATUSES.PARTIALLY_SHIPPED,
    ORDER_STATUSES.CANCELLED,
  ],
  [ORDER_STATUSES.READY_TO_SHIP]: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.CANCELLED],
  [ORDER_STATUSES.SHIPPED]: [ORDER_STATUSES.PARTIALLY_SHIPPED, ORDER_STATUSES.PARTIALLY_DELIVERED, ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.PARTIALLY_SHIPPED]: [ORDER_STATUSES.SHIPPED, ORDER_STATUSES.PARTIALLY_DELIVERED, ORDER_STATUSES.DELIVERED],
  [ORDER_STATUSES.PARTIALLY_DELIVERED]: [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.RETURNED],
  [ORDER_STATUSES.DELIVERED]: [ORDER_STATUSES.COMPLETED, ORDER_STATUSES.RETURNED],
  [ORDER_STATUSES.COMPLETED]: [ORDER_STATUSES.RETURNED],
  [ORDER_STATUSES.RETURNED]: [ORDER_STATUSES.REFUNDED],
  [ORDER_STATUSES.CANCELLED]: [],
  [ORDER_STATUSES.REFUNDED]: [],
});
