export const COUPON_DISCOUNT_TYPES = Object.freeze({
  PERCENTAGE: 'percentage',
  FIXED_AMOUNT: 'fixed_amount',
  FREE_SHIPPING: 'free_shipping',
  BUY_X_GET_Y: 'buy_x_get_y',
});

export const COUPON_DISCOUNT_TYPE_VALUES = Object.values(COUPON_DISCOUNT_TYPES);

// What the discount percentage/amount is actually computed against - the
// single biggest source of real-money bugs a jewellery promotion engine
// can have ("50% off Making Charges" silently meaning "50% off everything"
// - see coupon.model.js's own header comment). METAL_VALUE/STONE_VALUE are
// a deliberate, documented v2 follow-up: OrderItem doesn't persist a
// metal-value/stone-value split today, only the product's own
// pricing.makingCharges (real) and the item's final unitPrice/total.
export const DISCOUNT_BASES = Object.freeze({
  PRODUCT_PRICE: 'product_price',
  MAKING_CHARGES: 'making_charges',
  CART_SUBTOTAL: 'cart_subtotal',
  SHIPPING: 'shipping',
});

export const DISCOUNT_BASE_VALUES = Object.values(DISCOUNT_BASES);

export const COUPON_ELIGIBILITY_TYPES = Object.freeze({
  ALL_CUSTOMERS: 'all_customers',
  NEW_CUSTOMERS: 'new_customers',
  FIRST_ORDER: 'first_order',
  EXISTING_CUSTOMERS: 'existing_customers',
  VIP_CUSTOMERS: 'vip_customers',
  SELECTED_CUSTOMERS: 'selected_customers',
});

export const COUPON_ELIGIBILITY_VALUES = Object.values(COUPON_ELIGIBILITY_TYPES);

// Only DRAFT/ACTIVE/PAUSED/ARCHIVED are ever manually stored - EXPIRED and
// EXHAUSTED are always computed at read/validation time from real
// validUntil/usageLimit data, never trusted as a stored fact (same
// discipline as Campaign's own computeEffectiveStatus).
export const COUPON_STATUSES = Object.freeze({
  DRAFT: 'draft',
  SCHEDULED: 'scheduled',
  ACTIVE: 'active',
  PAUSED: 'paused',
  EXPIRED: 'expired',
  EXHAUSTED: 'exhausted',
  ARCHIVED: 'archived',
});

export const COUPON_STATUS_VALUES = Object.values(COUPON_STATUSES);
