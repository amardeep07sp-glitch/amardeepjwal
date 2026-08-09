export const CUSTOMER_STATUSES = Object.freeze({
  LEAD: 'lead',
  PROSPECT: 'prospect',
  ACTIVE: 'active',
  VIP: 'vip',
  INACTIVE: 'inactive',
  BLOCKED: 'blocked',
  ARCHIVED: 'archived',
});

export const CUSTOMER_TYPES = Object.freeze({
  RETAIL: 'retail',
  WHOLESALE: 'wholesale',
  B2B: 'b2b',
  B2C: 'b2c',
});

export const LEAD_SOURCES = Object.freeze({
  WALK_IN: 'walk_in',
  REFERRAL: 'referral',
  WEBSITE: 'website',
  SOCIAL_MEDIA: 'social_media',
  ADVERTISEMENT: 'advertisement',
  OTHER: 'other',
});

export const ADDRESS_TYPES = Object.freeze({
  BILLING: 'billing',
  SHIPPING: 'shipping',
  OFFICE: 'office',
  WAREHOUSE: 'warehouse',
});

export const GENDERS = Object.freeze({
  MALE: 'male',
  FEMALE: 'female',
  OTHER: 'other',
  UNSPECIFIED: 'unspecified',
});

// ---- Loyalty Engine ----

// Every point change must be expressed as one of these, written by
// loyaltyService.recordTransaction() - never applied to CustomerLoyalty
// directly. Same choke-point discipline as inventory.constants.js's
// MOVEMENT_TYPES / inventoryLedger.service.js.
export const LOYALTY_TXN_TYPES = Object.freeze({
  EARN: 'earn',
  REDEEM: 'redeem',
  EXPIRE: 'expire',
  ADJUST: 'adjust',
});

export const LOYALTY_TIERS = Object.freeze({
  SILVER: 'silver',
  GOLD: 'gold',
  PLATINUM: 'platinum',
  DIAMOND: 'diamond',
});

// Lifetime points earned -> tier. Fixed thresholds, consulted only by the
// pure loyalty.tier.js#resolveLoyaltyTier - change the business rule in one
// place, not at every call site.
export const LOYALTY_TIER_THRESHOLDS = Object.freeze([
  { tier: LOYALTY_TIERS.DIAMOND, minPoints: 20000 },
  { tier: LOYALTY_TIERS.PLATINUM, minPoints: 10000 },
  { tier: LOYALTY_TIERS.GOLD, minPoints: 5000 },
  { tier: LOYALTY_TIERS.SILVER, minPoints: 0 },
]);

// ---- Wallet Engine ----

export const WALLET_TXN_TYPES = Object.freeze({
  CREDIT: 'credit',
  DEBIT: 'debit',
  REFUND: 'refund',
  ADJUSTMENT: 'adjustment',
});

// Which direction a wallet txn type moves the balance - consulted by
// walletService.recordTransaction() so callers just say "debit 500", not
// "apply -500".
export const WALLET_TXN_SIGN = Object.freeze({
  [WALLET_TXN_TYPES.CREDIT]: 1,
  [WALLET_TXN_TYPES.DEBIT]: -1,
  [WALLET_TXN_TYPES.REFUND]: 1,
  [WALLET_TXN_TYPES.ADJUSTMENT]: 1, // adjustment's sign is carried by the caller's signed amount instead
});

// ---- Referral Engine ----

export const REFERRAL_STATUSES = Object.freeze({
  PENDING: 'pending',
  COMPLETED: 'completed',
  REWARDED: 'rewarded',
});

// ---- Communication Engine ----

export const NOTIFICATION_CHANNELS = Object.freeze({
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
  SMS: 'sms',
});

export const NOTIFICATION_STATUSES = Object.freeze({
  SENT: 'sent',
  DELIVERED: 'delivered',
  READ: 'read',
  FAILED: 'failed',
});

// ---- Timeline ----

export const CUSTOMER_TIMELINE_EVENTS = Object.freeze({
  REGISTERED: 'registered',
  ORDER_PLACED: 'order_placed',
  PAYMENT_RECEIVED: 'payment_received',
  REFUND_ISSUED: 'refund_issued',
  RETURN_PROCESSED: 'return_processed',
  WALLET_TRANSACTION: 'wallet_transaction',
  POINTS_EARNED: 'points_earned',
  POINTS_REDEEMED: 'points_redeemed',
  NOTE_ADDED: 'note_added',
  STATUS_CHANGED: 'status_changed',
});
