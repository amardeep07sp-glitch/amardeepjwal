export const PO_STATUS_LABELS = {
  draft: 'Draft',
  pending: 'Pending Approval',
  approved: 'Approved',
  ordered: 'Ordered',
  partially_received: 'Partially Received',
  received: 'Received',
  cancelled: 'Cancelled',
};

export const PO_STATUS_BADGE_VARIANTS = {
  draft: 'secondary',
  pending: 'warning',
  approved: 'info',
  ordered: 'info',
  partially_received: 'warning',
  received: 'success',
  cancelled: 'destructive',
};

// Forward-only, mirrors the backend's PO_STATUS_TRANSITIONS exactly
// (purchase.constants.js) - used only to decide which action buttons
// render; the backend re-validates every transition regardless.
export const PO_STATUS_TRANSITIONS = {
  draft: ['pending', 'cancelled'],
  pending: ['approved', 'cancelled'],
  approved: ['ordered', 'cancelled'],
  ordered: ['partially_received', 'received', 'cancelled'],
  partially_received: ['received', 'cancelled'],
  received: [],
  cancelled: [],
};

export const PO_PAYMENT_STATUS_LABELS = {
  pending: 'Pending',
  partial: 'Partial',
  paid: 'Paid',
  refunded: 'Refunded',
};

export const PO_PAYMENT_STATUS_BADGE_VARIANTS = {
  pending: 'warning',
  partial: 'warning',
  paid: 'success',
  refunded: 'secondary',
};

export const PURCHASE_PAYMENT_METHOD_LABELS = {
  cash: 'Cash',
  upi: 'UPI',
  bank: 'Bank Transfer',
  cheque: 'Cheque',
};

export const SUPPLIER_PAYMENT_STATUS_BADGE_VARIANTS = {
  paid: 'success',
  refunded: 'secondary',
};

export const PURCHASE_RETURN_ACTION_LABELS = {
  refund: 'Refund',
  replacement: 'Replacement',
};

export const PURCHASE_RETURN_STATUS_LABELS = {
  requested: 'Requested',
  approved: 'Approved',
  rejected: 'Rejected',
  completed: 'Completed',
};

export const PURCHASE_RETURN_STATUS_BADGE_VARIANTS = {
  requested: 'warning',
  approved: 'info',
  rejected: 'destructive',
  completed: 'success',
};

export const SUPPLIER_LEDGER_TYPE_LABELS = {
  purchase: 'Purchase',
  payment: 'Payment',
  return: 'Return',
  adjustment: 'Adjustment',
};
