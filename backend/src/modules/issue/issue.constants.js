export const ISSUE_CATEGORIES = Object.freeze({
  PRODUCT: 'product',
  COUPON: 'coupon',
  ORDER: 'order',
  PAYMENT: 'payment',
  CART: 'cart',
  CHECKOUT: 'checkout',
  SHIPPING: 'shipping',
  RETURN: 'return',
  REFUND: 'refund',
  INVOICE: 'invoice',
  ACCOUNT: 'account',
  OTHER: 'other',
});
export const ISSUE_CATEGORY_VALUES = Object.values(ISSUE_CATEGORIES);

// Per-category reason lists (Phases 6/9/11/13/14/15/17/19) - kept as a
// lookup map validated at the API layer rather than a strict per-category
// Mongoose enum, so a new reason can be added to one category without a
// migration touching the others.
export const ISSUE_SUBCATEGORIES_BY_CATEGORY = Object.freeze({
  product: ['incorrect_information', 'incorrect_price', 'wrong_image', 'wrong_specification', 'size_information_incorrect', 'unavailable_product', 'suspicious_information', 'other'],
  coupon: ['not_applying', 'minimum_order_not_met', 'expired', 'invalid_code', 'excluded_product', 'other'],
  order: ['order_delayed', 'wrong_product', 'damaged_product', 'missing_product', 'incorrect_quantity', 'invoice_issue', 'payment_issue', 'refund_issue', 'delivery_issue', 'product_quality_issue', 'other'],
  payment: ['payment_failed', 'amount_deducted_order_not_placed', 'duplicate_charge', 'wrong_amount', 'other'],
  cart: ['price_calculation', 'coupon_not_applying', 'item_missing', 'other'],
  checkout: ['address_issue', 'coupon_issue', 'pricing_issue', 'shipping_issue', 'payment_issue', 'other'],
  shipping: ['delayed_delivery', 'tracking_not_updating', 'wrong_tracking_information', 'delivery_failed', 'package_damaged', 'package_missing', 'other'],
  return: ['damaged', 'wrong_product', 'size_issue', 'quality_issue', 'product_mismatch', 'missing_certificate', 'missing_item', 'other'],
  refund: ['refund_delayed', 'refund_not_received', 'wrong_refund_amount', 'other'],
  invoice: ['invoice_missing', 'incorrect_amount', 'incorrect_customer_details', 'incorrect_tax_information', 'invoice_download_failed', 'other'],
  account: ['login_issue', 'otp_issue', 'profile_update_issue', 'suspicious_activity', 'account_security_issue', 'other'],
  other: ['other'],
});

export const ISSUE_PRIORITIES = Object.freeze({ LOW: 'low', MEDIUM: 'medium', HIGH: 'high', URGENT: 'urgent' });
export const ISSUE_PRIORITY_VALUES = Object.values(ISSUE_PRIORITIES);

export const ISSUE_STATUSES = Object.freeze({
  OPEN: 'open',
  UNDER_REVIEW: 'under_review',
  IN_PROGRESS: 'in_progress',
  WAITING_FOR_CUSTOMER: 'waiting_for_customer',
  RESOLVED: 'resolved',
  REJECTED: 'rejected',
  CLOSED: 'closed',
});
export const ISSUE_STATUS_VALUES = Object.values(ISSUE_STATUSES);

// AUTOMATED (Phase 59) - system-created, never a customer action; the
// admin queue's "source" column is how staff tell these apart from a real
// customer complaint.
export const ISSUE_SOURCES = Object.freeze({ WEB: 'web', CONTEXTUAL: 'contextual', AUTOMATED: 'automated' });
export const ISSUE_SOURCE_VALUES = Object.values(ISSUE_SOURCES);

// Phase 32 - a still-open report on the exact same entity from the same
// reporter within this window is treated as "the same problem, reported
// again" rather than a fresh issue - see issue.service.js#createIssue.
export const ISSUE_DUPLICATE_WINDOW_HOURS = 24;
export const ISSUE_NON_TERMINAL_STATUSES = [
  ISSUE_STATUSES.OPEN,
  ISSUE_STATUSES.UNDER_REVIEW,
  ISSUE_STATUSES.IN_PROGRESS,
  ISSUE_STATUSES.WAITING_FOR_CUSTOMER,
];
