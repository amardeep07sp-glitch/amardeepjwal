import { z } from 'zod';
import { mediaRefSchema } from '../../media/mediaSchema';

export const CATALOG_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
];

export const STATUS_BADGE_VARIANTS = {
  draft: 'secondary',
  published: 'success',
  hidden: 'warning',
  archived: 'destructive',
};

export const NO_RELATION_VALUE = 'none';

// Storefront merchandising facets (mega menu, category filters) - values
// must exactly match backend/src/constants/catalog.js's GENDERS/OCCASIONS,
// there's no API to fetch these from since they're a small fixed enum, not
// admin-editable data like Brand/Collection.
export const GENDERS = [
  { value: 'men', label: 'Men' },
  { value: 'women', label: 'Women' },
  { value: 'kids', label: 'Kids' },
  { value: 'unisex', label: 'Unisex' },
];

export const OCCASIONS = [
  { value: 'daily-wear', label: 'Daily Wear' },
  { value: 'office-wear', label: 'Office Wear' },
  { value: 'wedding', label: 'Wedding' },
  { value: 'engagement', label: 'Engagement' },
  { value: 'festive', label: 'Festive' },
  { value: 'party', label: 'Party' },
  { value: 'anniversary', label: 'Anniversary' },
  { value: 'gifting', label: 'Gifting' },
];

// Real jewellery classification (must match backend/src/constants/catalog.js
// JEWELLERY_METALS/JEWELLERY_PURITIES_BY_METAL/GEMSTONE_TYPES exactly) - the
// one thing the promotion engine's "20% off Gold" style rules can actually
// rely on existing for every product, unlike the optional Attribute system.
export const METALS = [
  { value: 'gold', label: 'Gold' },
  { value: 'silver', label: 'Silver' },
  { value: 'platinum', label: 'Platinum' },
  { value: 'other', label: 'Other' },
];

export const PURITIES_BY_METAL = {
  gold: ['24K', '22K', '18K', '14K'],
  silver: ['999', '925'],
  platinum: ['950', '900'],
  other: [],
};

export const GEMSTONE_TYPES = [
  { value: 'none', label: 'None' },
  { value: 'diamond', label: 'Diamond' },
  { value: 'ruby', label: 'Ruby' },
  { value: 'emerald', label: 'Emerald' },
  { value: 'sapphire', label: 'Sapphire' },
  { value: 'pearl', label: 'Pearl' },
  { value: 'other', label: 'Other' },
];

// Tags / search keywords are edited as a single comma-separated string in the
// form for simplicity, then split into arrays right before hitting the API.
export const splitCommaList = (value) =>
  value
    .split(',')
    .map((item) => item.trim())
    .filter(Boolean);

export const joinCommaList = (list) => (list ?? []).join(', ');

export const productSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  // Optional - left blank on create, the server auto-generates one from the
  // category's skuPrefix. Immutable after creation (see the dedicated
  // "Change SKU" super-admin-only action instead of editing this field).
  sku: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(CATALOG_STATUSES.map((s) => s.value)).default('draft'),
  isFeatured: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  order: z.coerce.number().default(0),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional(),
  collectionId: z.string().optional(),
  attributeGroups: z.array(z.string()).default([]),
  tagsInput: z.string().optional(),
  searchKeywordsInput: z.string().optional(),
  gender: z.string().default(NO_RELATION_VALUE),
  occasion: z.array(z.string()).default([]),
  metal: z.string().default(NO_RELATION_VALUE),
  purity: z.string().default(''),
  gemstoneType: z.string().default('none'),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.string().optional(),
    canonicalUrl: z.string().optional(),
    ogImageMedia: mediaRefSchema,
  }),
});

export const productFormDefaults = {
  name: '',
  slug: '',
  sku: '',
  shortDescription: '',
  description: '',
  status: 'draft',
  isFeatured: false,
  isVisible: true,
  order: 0,
  category: '',
  brand: NO_RELATION_VALUE,
  collectionId: NO_RELATION_VALUE,
  attributeGroups: [],
  tagsInput: '',
  searchKeywordsInput: '',
  gender: NO_RELATION_VALUE,
  occasion: [],
  metal: NO_RELATION_VALUE,
  purity: '',
  gemstoneType: 'none',
  seo: { metaTitle: '', metaDescription: '', metaKeywords: '', canonicalUrl: '', ogImageMedia: null },
};
