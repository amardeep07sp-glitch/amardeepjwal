// Must match backend/src/modules/issue/issue.constants.js exactly.
export const ISSUE_CATEGORIES = [
  { value: 'product', label: 'Product' },
  { value: 'coupon', label: 'Coupon' },
  { value: 'order', label: 'Order' },
  { value: 'payment', label: 'Payment' },
  { value: 'cart', label: 'Cart' },
  { value: 'checkout', label: 'Checkout' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'return', label: 'Return' },
  { value: 'refund', label: 'Refund' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'account', label: 'Account' },
  { value: 'other', label: 'Other' },
];

export const ISSUE_STATUSES = [
  { value: 'open', label: 'Open' },
  { value: 'under_review', label: 'Under Review' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'waiting_for_customer', label: 'Waiting on Customer' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'rejected', label: 'Rejected' },
  { value: 'closed', label: 'Closed' },
];

export const ISSUE_STATUS_VARIANTS = {
  open: 'info',
  under_review: 'warning',
  in_progress: 'warning',
  waiting_for_customer: 'secondary',
  resolved: 'success',
  rejected: 'destructive',
  closed: 'secondary',
};
