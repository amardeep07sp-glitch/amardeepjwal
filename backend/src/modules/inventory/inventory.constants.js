export const STOCK_STATUSES = Object.freeze({
  IN_STOCK: 'in_stock',
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  PRE_ORDER: 'pre_order',
  DISCONTINUED: 'discontinued',
});

// Every stock-quantity change must be expressed as one of these, written by
// inventoryLedgerService.recordMovement() - never applied to Inventory
// directly. See inventoryLedger.service.js for the single choke-point.
export const MOVEMENT_TYPES = Object.freeze({
  OPENING_STOCK: 'opening_stock',
  PURCHASE: 'purchase',
  SALE: 'sale',
  RETURN: 'return',
  DAMAGE: 'damage',
  TRANSFER_IN: 'transfer_in',
  TRANSFER_OUT: 'transfer_out',
  MANUAL_ADJUSTMENT: 'manual_adjustment',
  STOCK_AUDIT: 'stock_audit',
  RESERVATION: 'reservation',
  RESERVATION_RELEASE: 'reservation_release',
  // Phase 9 (Purchase & Supplier Management) - PURCHASE_ORDERED marks stock
  // as "on the way" the moment a Purchase Order is marked Ordered (before it
  // physically arrives); PURCHASE_ORDER_CANCELLED reverses that commitment
  // if the PO is cancelled before receipt. The existing PURCHASE type
  // (opening_stock's sibling, already wired to availableQuantity) is reused
  // as-is for the actual Goods Receipt - see
  // goodsReceiptNote.service.js#receiveGoods.
  PURCHASE_ORDERED: 'purchase_ordered',
  PURCHASE_ORDER_CANCELLED: 'purchase_order_cancelled',
  // Stock physically leaving the building back to a supplier (Purchase
  // Return) - distinct from the customer-facing RETURN type above, which
  // credits returnedQuantity (stock coming back IN, pending QC) rather than
  // debiting availableQuantity (stock going back OUT to the supplier).
  PURCHASE_RETURN: 'purchase_return',
});

// Which Inventory quantity field a movement type debits/credits, and in
// which direction relative to quantityChanged's sign. Used by
// inventoryLedger.service.js to know which field to touch without a giant
// switch statement scattered across callers.
export const MOVEMENT_TARGET_FIELD = Object.freeze({
  [MOVEMENT_TYPES.OPENING_STOCK]: 'availableQuantity',
  [MOVEMENT_TYPES.PURCHASE]: 'availableQuantity',
  [MOVEMENT_TYPES.SALE]: 'availableQuantity',
  [MOVEMENT_TYPES.RETURN]: 'returnedQuantity',
  [MOVEMENT_TYPES.DAMAGE]: 'damagedQuantity',
  [MOVEMENT_TYPES.TRANSFER_IN]: 'availableQuantity',
  [MOVEMENT_TYPES.TRANSFER_OUT]: 'availableQuantity',
  [MOVEMENT_TYPES.MANUAL_ADJUSTMENT]: 'availableQuantity',
  [MOVEMENT_TYPES.STOCK_AUDIT]: 'availableQuantity',
  [MOVEMENT_TYPES.RESERVATION]: 'reservedQuantity',
  [MOVEMENT_TYPES.RESERVATION_RELEASE]: 'reservedQuantity',
  [MOVEMENT_TYPES.PURCHASE_ORDERED]: 'incomingQuantity',
  [MOVEMENT_TYPES.PURCHASE_ORDER_CANCELLED]: 'incomingQuantity',
  [MOVEMENT_TYPES.PURCHASE_RETURN]: 'availableQuantity',
});

export const BARCODE_TYPES = Object.freeze({
  CODE128: 'code128',
  CODE39: 'code39',
  EAN13: 'ean13',
  EAN8: 'ean8',
  UPC: 'upc',
  QR: 'qr',
});

export const BARCODE_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

export const WAREHOUSE_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

export const ADJUSTMENT_TYPES = Object.freeze({
  INCREASE: 'increase',
  DECREASE: 'decrease',
});

export const ADJUSTMENT_STATUSES = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const TRANSFER_STATUSES = Object.freeze({
  REQUESTED: 'requested',
  APPROVED: 'approved',
  COMPLETED: 'completed',
  REJECTED: 'rejected',
  CANCELLED: 'cancelled',
});

export const AUDIT_STATUSES = Object.freeze({
  DRAFT: 'draft',
  COMPLETED: 'completed',
});

export const ALERT_TYPES = Object.freeze({
  LOW_STOCK: 'low_stock',
  OUT_OF_STOCK: 'out_of_stock',
  NEGATIVE_STOCK_ATTEMPT: 'negative_stock_attempt',
  REORDER_REQUIRED: 'reorder_required',
  INACTIVE_INVENTORY: 'inactive_inventory',
  EXPIRED_RESERVATION: 'expired_reservation',
});

export const ALERT_STATUSES = Object.freeze({
  OPEN: 'open',
  ACKNOWLEDGED: 'acknowledged',
  RESOLVED: 'resolved',
});
