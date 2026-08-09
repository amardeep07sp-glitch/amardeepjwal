export const CATALOG_STATUSES = Object.freeze({
  DRAFT: 'draft',
  PUBLISHED: 'published',
  HIDDEN: 'hidden',
  ARCHIVED: 'archived',
});

export const ACTIVE_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

// A product's audience/fit - shown as storefront filters (mega menu,
// category page facets) and set on the product form in the admin panel.
// A single canonical list so validation, the Mongoose enum, and both
// frontends' dropdown options can never drift apart.
export const GENDERS = Object.freeze({
  MEN: 'men',
  WOMEN: 'women',
  KIDS: 'kids',
  UNISEX: 'unisex',
});

// A product can suit more than one occasion (a necklace can be both
// "Wedding" and "Party"), so this backs a multi-select field, unlike Gender.
export const OCCASIONS = Object.freeze({
  DAILY_WEAR: 'daily-wear',
  OFFICE_WEAR: 'office-wear',
  WEDDING: 'wedding',
  ENGAGEMENT: 'engagement',
  FESTIVE: 'festive',
  PARTY: 'party',
  ANNIVERSARY: 'anniversary',
  GIFTING: 'gifting',
});
