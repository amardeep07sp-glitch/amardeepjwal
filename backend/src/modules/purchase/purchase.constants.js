export const PO_STATUSES = Object.freeze({
  DRAFT: 'draft',
  PENDING: 'pending',
  APPROVED: 'approved',
  ORDERED: 'ordered',
  PARTIALLY_RECEIVED: 'partially_received',
  RECEIVED: 'received',
  CANCELLED: 'cancelled',
});

// Forward-only, linear (mirrors order.statusTransition.js's discipline) -
// purchase.statusTransition.js#canTransition is the single place this is
// consulted. Received/Cancelled are terminal; a discrepancy after Received
// is handled by a PurchaseReturn against the PO, not by reopening its
// status.
export const PO_STATUS_TRANSITIONS = Object.freeze({
  [PO_STATUSES.DRAFT]: [PO_STATUSES.PENDING, PO_STATUSES.CANCELLED],
  [PO_STATUSES.PENDING]: [PO_STATUSES.APPROVED, PO_STATUSES.CANCELLED],
  [PO_STATUSES.APPROVED]: [PO_STATUSES.ORDERED, PO_STATUSES.CANCELLED],
  [PO_STATUSES.ORDERED]: [PO_STATUSES.PARTIALLY_RECEIVED, PO_STATUSES.RECEIVED, PO_STATUSES.CANCELLED],
  [PO_STATUSES.PARTIALLY_RECEIVED]: [PO_STATUSES.RECEIVED, PO_STATUSES.CANCELLED],
  [PO_STATUSES.RECEIVED]: [],
  [PO_STATUSES.CANCELLED]: [],
});

// A PO can only be received (goodsReceiptNote.service.js) while it's in one
// of these statuses - guarantees Inventory.incomingQuantity (bumped exactly
// once, at the Ordered transition) is always the true source of "how much
// is left to receive".
export const PO_RECEIVABLE_STATUSES = Object.freeze([PO_STATUSES.ORDERED, PO_STATUSES.PARTIALLY_RECEIVED]);

export const PO_PAYMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  PARTIAL: 'partial',
  PAID: 'paid',
  REFUNDED: 'refunded',
});

export const PURCHASE_PAYMENT_METHODS = Object.freeze({
  CASH: 'cash',
  UPI: 'upi',
  BANK: 'bank',
  CHEQUE: 'cheque',
});

export const SUPPLIER_PAYMENT_STATUSES = Object.freeze({
  PAID: 'paid',
  REFUNDED: 'refunded',
});

export const PURCHASE_RETURN_ACTIONS = Object.freeze({
  REFUND: 'refund',
  REPLACEMENT: 'replacement',
});

export const PURCHASE_RETURN_STATUSES = Object.freeze({
  REQUESTED: 'requested',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  COMPLETED: 'completed',
});

export const PURCHASE_RETURN_STATUS_TRANSITIONS = Object.freeze({
  [PURCHASE_RETURN_STATUSES.REQUESTED]: [PURCHASE_RETURN_STATUSES.APPROVED, PURCHASE_RETURN_STATUSES.REJECTED],
  [PURCHASE_RETURN_STATUSES.APPROVED]: [PURCHASE_RETURN_STATUSES.COMPLETED],
  [PURCHASE_RETURN_STATUSES.REJECTED]: [],
  [PURCHASE_RETURN_STATUSES.COMPLETED]: [],
});

// Every purchase/payment/return posts exactly one of these to
// SupplierLedger - see supplierLedger.service.js#recordEntry. `purchase` is
// posted at Goods Receipt (liability is recognized when goods actually
// arrive, not when the PO is merely placed), never at PO approval/ordering.
export const SUPPLIER_LEDGER_TYPES = Object.freeze({
  PURCHASE: 'purchase',
  PAYMENT: 'payment',
  RETURN: 'return',
  ADJUSTMENT: 'adjustment',
});
