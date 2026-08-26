export const HELP_ARTICLE_STATUSES = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  ARCHIVED: 'archived',
});

export const HELP_ARTICLE_STATUS_VALUES = Object.values(HELP_ARTICLE_STATUSES);

// The Phase 3 category list, kept as a fixed enum (not an admin-editable
// HelpCategory collection) deliberately - these are the entry points
// contextual help buttons key off (`ContextualHelp` looks up "Orders",
// "Payments" etc. by this exact code, not a free-text admin-typed name),
// so they can't silently drift out from under the frontend's context map.
// Admins still fully control the ARTICLES within each category (create,
// edit, publish, reorder, feature) - just not the category list itself.
export const HELP_CATEGORIES = Object.freeze({
  ORDERS: 'orders',
  PAYMENTS: 'payments',
  SHIPPING: 'shipping',
  RETURNS_REFUNDS: 'returns_refunds',
  COUPONS_OFFERS: 'coupons_offers',
  JEWELLERY_PRICING: 'jewellery_pricing',
  ACCOUNT: 'account',
  INVOICE: 'invoice',
  WISHLIST: 'wishlist',
  REVIEWS: 'reviews',
  WEBSITE: 'website',
  SECURITY: 'security',
});

export const HELP_CATEGORY_VALUES = Object.values(HELP_CATEGORIES);
