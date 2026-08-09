// Every customer-facing action the spec names explicitly - the Event
// Engine's single, closed vocabulary. Anything not in this list is
// rejected at the ingestion boundary (event.validation.js), not silently
// accepted as a free-text string - an analytics platform whose event
// types can drift is one whose reports can never be trusted.
export const EVENT_TYPES = Object.freeze({
  PAGE_VIEW: 'page_view',
  LOGIN: 'login',
  LOGOUT: 'logout',
  REGISTER: 'register',
  OTP_VERIFIED: 'otp_verified',
  SEARCH: 'search',
  PRODUCT_VIEW: 'product_view',
  CATEGORY_VIEW: 'category_view',
  BRAND_VIEW: 'brand_view',
  COLLECTION_VIEW: 'collection_view',
  BANNER_CLICK: 'banner_click',
  FILTER_APPLIED: 'filter_applied',
  SORT_APPLIED: 'sort_applied',
  WISHLIST_ADD: 'wishlist_add',
  WISHLIST_REMOVE: 'wishlist_remove',
  ADD_TO_CART: 'add_to_cart',
  REMOVE_FROM_CART: 'remove_from_cart',
  CHECKOUT_STARTED: 'checkout_started',
  PAYMENT_STARTED: 'payment_started',
  PAYMENT_SUCCESS: 'payment_success',
  PAYMENT_FAILED: 'payment_failed',
  ORDER_PLACED: 'order_placed',
  REVIEW_ADDED: 'review_added',
  PROFILE_UPDATED: 'profile_updated',
  COUPON_APPLIED: 'coupon_applied',
  REFERRAL_SHARED: 'referral_shared',
  IMAGE_CLICK: 'image_click',
  VIDEO_PLAY: 'video_play',
  PRODUCT_ZOOM: 'product_zoom',
});

export const VISITOR_TYPES = Object.freeze({
  ANONYMOUS: 'anonymous',
  REGISTERED: 'registered',
  CUSTOMER: 'customer',
  GUEST_CHECKOUT: 'guest_checkout',
});

export const DEVICE_TYPES = Object.freeze({
  DESKTOP: 'desktop',
  MOBILE: 'mobile',
  TABLET: 'tablet',
  UNKNOWN: 'unknown',
});

export const TRAFFIC_SOURCES = Object.freeze({
  DIRECT: 'direct',
  GOOGLE: 'google',
  FACEBOOK: 'facebook',
  INSTAGRAM: 'instagram',
  WHATSAPP: 'whatsapp',
  EMAIL: 'email',
  REFERRAL: 'referral',
  CAMPAIGN: 'campaign',
});

// The 7 named funnel steps, in order - each maps to one real event type
// (or a page_view carrying that pageType), so funnelAnalytics.service.js
// never needs a parallel definition of what "the funnel" means.
export const FUNNEL_STEPS = Object.freeze([
  { key: 'homepage', label: 'Homepage', eventType: EVENT_TYPES.PAGE_VIEW, pageType: 'home' },
  { key: 'category', label: 'Category', eventType: EVENT_TYPES.CATEGORY_VIEW, pageType: null },
  { key: 'product', label: 'Product', eventType: EVENT_TYPES.PRODUCT_VIEW, pageType: null },
  { key: 'cart', label: 'Cart', eventType: EVENT_TYPES.ADD_TO_CART, pageType: null },
  { key: 'checkout', label: 'Checkout', eventType: EVENT_TYPES.CHECKOUT_STARTED, pageType: null },
  { key: 'payment', label: 'Payment', eventType: EVENT_TYPES.PAYMENT_STARTED, pageType: null },
  { key: 'success', label: 'Success', eventType: EVENT_TYPES.PAYMENT_SUCCESS, pageType: null },
]);

// Auto-generated, CIP-owned intelligence (see segmentSnapshot.model.js) -
// deliberately NEVER written onto Customer.segments (Phase 8's CRM-owned
// field). CIP computes; it never mutates CRM.
export const SEGMENT_KEYS = Object.freeze({
  NEW_CUSTOMER: 'new_customer',
  RETURNING: 'returning',
  VIP: 'vip',
  HIGH_VALUE: 'high_value',
  INACTIVE: 'inactive',
  FREQUENT_BUYER: 'frequent_buyer',
  CART_ABANDONER: 'cart_abandoner',
  WINDOW_SHOPPER: 'window_shopper',
});

// "Do not store passwords, OTPs or sensitive payment data" - enforced at
// the ingestion boundary itself (event.service.js#sanitizeMetadata), not
// left to every future caller to remember. Any metadata key matching this
// is dropped before the event is ever persisted.
export const FORBIDDEN_METADATA_KEY_PATTERN = /password|passwd|otp|cvv|card(number)?|pin\b|ssn|aadhaar|secret|token|auth/i;

// A session with no further activity for this long is considered ended by
// the stale-session sweep (session.jobs.js) - not left open indefinitely.
export const SESSION_IDLE_TIMEOUT_MINUTES = 30;

// A session counts as a "bounce" if it produced exactly one page view and
// lasted less than this long.
export const BOUNCE_MAX_DURATION_SECONDS = 10;

// Segmentation thresholds (segmentation.service.js) - plain, documented
// constants rather than a configurable rules engine, per the spec's own
// "Future AI Ready" framing (a real rules/ML engine is future work; these
// are the honest, simple v1 rules it would replace).
export const SEGMENT_THRESHOLDS = Object.freeze({
  NEW_CUSTOMER_DAYS: 30,
  INACTIVE_DAYS: 120,
  VIP_LIFETIME_VALUE: 100000,
  HIGH_VALUE_LIFETIME_VALUE: 25000,
  FREQUENT_BUYER_MIN_ORDERS: 5,
  FREQUENT_BUYER_WINDOW_DAYS: 180,
  CART_ABANDONER_WINDOW_DAYS: 30,
  WINDOW_SHOPPER_MIN_VIEWS: 5,
});
