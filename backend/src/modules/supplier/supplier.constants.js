export const SUPPLIER_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
});

export const SUPPLIER_ADDRESS_TYPES = Object.freeze({
  BILLING: 'billing',
  SHIPPING: 'shipping',
  OFFICE: 'office',
  WAREHOUSE: 'warehouse',
});

// Supplier-facing milestone feed events - PO/GRN/Payment/Return lifecycle
// events all land here too (tagged with the relevant number in the
// timeline note), same "every interaction must be tracked" discipline as
// Phase 8's CustomerTimeline - see supplier.audit.js and purchase.audit.js.
export const SUPPLIER_TIMELINE_EVENTS = Object.freeze({
  REGISTERED: 'registered',
  STATUS_CHANGED: 'status_changed',
  NOTE_ADDED: 'note_added',
  PO_CREATED: 'po_created',
  PO_APPROVED: 'po_approved',
  PO_ORDERED: 'po_ordered',
  PO_CANCELLED: 'po_cancelled',
  GRN_RECEIVED: 'grn_received',
  PAYMENT_RECORDED: 'payment_recorded',
  PAYMENT_REFUNDED: 'payment_refunded',
  RETURN_REQUESTED: 'return_requested',
  RETURN_PROCESSED: 'return_processed',
});
