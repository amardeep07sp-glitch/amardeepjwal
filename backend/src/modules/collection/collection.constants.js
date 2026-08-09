export const COLLECTION_TYPES = Object.freeze({
  MANUAL: 'manual',
  AUTOMATIC: 'automatic',
  SEASONAL: 'seasonal',
  FESTIVAL: 'festival',
  LIMITED_EDITION: 'limited_edition',
  TRENDING: 'trending',
  NEW_ARRIVAL: 'new_arrival',
  BEST_SELLER: 'best_seller',
  CURATED: 'curated',
});

// How a collection's product membership is decided - see collection.rules.js
// for the RULE_BASED resolution and product.repository.js's
// findPublicByManualCollection for the MANUAL one.
export const ASSIGNMENT_TYPES = Object.freeze({
  MANUAL: 'manual',
  RULE_BASED: 'rule_based',
});

// Every criterion the Rule Builder can filter Product on - see
// collection.rules.js#buildRuleFilter for how each maps onto a real
// Product/Inventory field. Not every operator is valid for every field
// (enforced at the zod layer, collection.validation.js).
export const RULE_FIELDS = Object.freeze({
  CATEGORY: 'category',
  BRAND: 'brand',
  PRICE: 'price',
  TAGS: 'tags',
  ATTRIBUTES: 'attributes',
  STOCK: 'stock',
  FEATURED: 'featured',
  STATUS: 'status',
});

export const RULE_OPERATORS = Object.freeze({
  EQUALS: 'equals',
  NOT_EQUALS: 'not_equals',
  IN: 'in',
  NOT_IN: 'not_in',
  GTE: 'gte',
  LTE: 'lte',
  BETWEEN: 'between',
  CONTAINS: 'contains',
});

// AND vs OR across a rule group's conditions.
export const RULE_MATCH_MODES = Object.freeze({
  ALL: 'all',
  ANY: 'any',
});

export const MERCHANDISING_SORT_MODES = Object.freeze({
  MANUAL: 'manual',
  NEWEST: 'newest',
  PRICE_ASC: 'price_asc',
  PRICE_DESC: 'price_desc',
  BEST_SELLING: 'best_selling',
  MOST_VIEWED: 'most_viewed',
  RANDOM: 'random',
});

export const VISIBILITY_LEVELS = Object.freeze({
  PUBLIC: 'public',
  MEMBERS: 'members',
  VIP: 'vip',
  HIDDEN: 'hidden',
});

// Fail-closed: until a real customer-auth/membership system exists, every
// public storefront read only ever returns 'public' collections - members/vip
// are schema+admin ready but never actually gated on anything real yet, so
// they must never be served publicly (that would fake a check that isn't
// there). Revisit once a membership phase exists.
export const PUBLIC_VISIBLE_LEVELS = Object.freeze([VISIBILITY_LEVELS.PUBLIC]);
