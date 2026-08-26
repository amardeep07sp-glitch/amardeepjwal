// Must match backend/src/modules/support/support.constants.js exactly.
export const TICKET_CATEGORIES = [
  { value: 'order', label: 'Order' },
  { value: 'payment', label: 'Payment' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'return', label: 'Return' },
  { value: 'refund', label: 'Refund' },
  { value: 'product', label: 'Product' },
  { value: 'coupon', label: 'Coupon' },
  { value: 'account', label: 'Account' },
  { value: 'technical', label: 'Technical' },
  { value: 'other', label: 'Other' },
];

export const TICKET_PRIORITIES = [
  { value: 'low', label: 'Low' },
  { value: 'medium', label: 'Medium' },
  { value: 'high', label: 'High' },
  { value: 'urgent', label: 'Urgent' },
];

// Manual transitions only - see backend TICKET_STATUS_TRANSITIONS for the
// full allowed-move graph this UI must respect (a status change request
// the backend rejects still surfaces as a real error toast, this is just
// what's offered in the picker per current status).
export const TICKET_STATUS_TRANSITIONS = {
  open: ['in_progress', 'closed'],
  in_progress: ['waiting_for_customer', 'resolved', 'closed'],
  waiting_for_customer: ['in_progress', 'closed'],
  resolved: ['in_progress', 'closed'],
  closed: [],
};

export const TICKET_STATUS_LABELS = {
  open: 'Open',
  in_progress: 'In Progress',
  waiting_for_customer: 'Waiting on Customer',
  resolved: 'Resolved',
  closed: 'Closed',
};

export const TICKET_STATUS_VARIANTS = {
  open: 'info',
  in_progress: 'warning',
  waiting_for_customer: 'secondary',
  resolved: 'success',
  closed: 'secondary',
};

export const PRIORITY_BADGE_VARIANTS = { low: 'secondary', medium: 'info', high: 'warning', urgent: 'destructive' };
