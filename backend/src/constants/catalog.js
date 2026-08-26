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

// A brand's optional "showcase" fields (brand.model.js#showcase) let a
// flagship brand (e.g. Mudrika) render as a full landing page instead of
// just a product grid - craft-process steps and trust badges each pick an
// icon from this fixed set (rendered client-side via a lucide-react
// lookup, see client/src/lib/brandShowcaseIcons.js) rather than accepting
// arbitrary icon names admin could typo into a broken/blank icon.
export const BRAND_SHOWCASE_ICONS = Object.freeze([
  'Compass',
  'Award',
  'Sparkles',
  'Crown',
  'ShieldCheck',
  'RotateCcw',
  'Truck',
  'Gem',
  'Star',
  'Heart',
  'Gift',
  'Clock',
  'CheckCircle2',
  'Flame',
  'Diamond',
]);

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

// Real, first-class product fields - deliberately NOT modeled through the
// generic AttributeGroup/Attribute/AttributeValue system (that data is
// admin-optional, attaches at the Variant level only, and nothing seeds
// it - see the promotion engine's own audit notes). A jewellery-specific
// promotion rule ("20% off Gold") needs a field that's actually reliably
// present on every Product, not one that only exists if an admin happens
// to have configured a matching attribute for that specific item.
export const JEWELLERY_METALS = Object.freeze({
  GOLD: 'gold',
  SILVER: 'silver',
  PLATINUM: 'platinum',
  OTHER: 'other',
});

// Purity is metal-specific real-world jewellery terminology, not an
// invented scale - used to validate admin input and to drive the admin
// form's purity dropdown once a metal is chosen.
export const JEWELLERY_PURITIES_BY_METAL = Object.freeze({
  gold: ['24K', '22K', '18K', '14K'],
  silver: ['999', '925'],
  platinum: ['950', '900'],
  other: [],
});

export const JEWELLERY_PURITY_VALUES = Object.freeze([
  ...new Set(Object.values(JEWELLERY_PURITIES_BY_METAL).flat()),
]);

export const GEMSTONE_TYPES = Object.freeze({
  NONE: 'none',
  DIAMOND: 'diamond',
  RUBY: 'ruby',
  EMERALD: 'emerald',
  SAPPHIRE: 'sapphire',
  PEARL: 'pearl',
  OTHER: 'other',
});
