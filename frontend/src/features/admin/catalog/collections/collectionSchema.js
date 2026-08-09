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

export const COLLECTION_TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'automatic', label: 'Automatic' },
  { value: 'seasonal', label: 'Seasonal' },
  { value: 'festival', label: 'Festival' },
  { value: 'limited_edition', label: 'Limited Edition' },
  { value: 'trending', label: 'Trending' },
  { value: 'new_arrival', label: 'New Arrival' },
  { value: 'best_seller', label: 'Best Seller' },
  { value: 'curated', label: 'Curated' },
];

export const ASSIGNMENT_TYPE_OPTIONS = [
  { value: 'manual', label: 'Manual' },
  { value: 'rule_based', label: 'Rule Based' },
];

export const RULE_FIELD_OPTIONS = [
  { value: 'category', label: 'Category' },
  { value: 'brand', label: 'Brand' },
  { value: 'price', label: 'Price' },
  { value: 'tags', label: 'Tags' },
  { value: 'attributes', label: 'Attributes' },
  { value: 'stock', label: 'Stock' },
  { value: 'featured', label: 'Featured' },
  { value: 'status', label: 'Status' },
];

export const STOCK_RULE_VALUE_OPTIONS = [
  { value: 'in_stock', label: 'In Stock' },
  { value: 'out_of_stock', label: 'Out of Stock' },
];

export const SORT_MODE_OPTIONS = [
  { value: 'manual', label: 'Manual Sort' },
  { value: 'newest', label: 'Newest' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'best_selling', label: 'Best Selling' },
  { value: 'most_viewed', label: 'Most Viewed' },
  { value: 'random', label: 'Random' },
];

export const VISIBILITY_OPTIONS = [
  { value: 'public', label: 'Public' },
  { value: 'members', label: 'Members' },
  { value: 'vip', label: 'VIP' },
  { value: 'hidden', label: 'Hidden' },
];

const ruleConditionSchema = z.object({
  field: z.enum(RULE_FIELD_OPTIONS.map((o) => o.value)),
  operator: z.string().min(1),
  value: z.any(),
});

const rulesSchema = z.object({
  matchMode: z.enum(['all', 'any']).default('all'),
  conditions: z.array(ruleConditionSchema).default([]),
});

const faqSchema = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

export const collectionSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  bannerMedia: mediaRefSchema,
  thumbnailMedia: mediaRefSchema,
  mobileBannerMedia: mediaRefSchema,
  promoVideoMedia: mediaRefSchema,
  status: z.enum(CATALOG_STATUSES.map((s) => s.value)).default('draft'),
  isFeatured: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  order: z.coerce.number().default(0),

  type: z.enum(COLLECTION_TYPE_OPTIONS.map((o) => o.value)).default('manual'),
  assignmentType: z.enum(ASSIGNMENT_TYPE_OPTIONS.map((o) => o.value)).default('manual'),
  rules: rulesSchema.default({ matchMode: 'all', conditions: [] }),

  startDate: z.string().nullable().default(null),
  endDate: z.string().nullable().default(null),
  autoPublish: z.boolean().default(false),
  autoArchive: z.boolean().default(false),

  sortMode: z.enum(SORT_MODE_OPTIONS.map((o) => o.value)).default('manual'),
  visibility: z.enum(VISIBILITY_OPTIONS.map((o) => o.value)).default('public'),

  faqs: z.array(faqSchema).default([]),
  relatedCollections: z.array(z.string()).default([]),
  parentCampaign: z.string().nullable().default(null),

  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.string().optional(),
    canonicalUrl: z.string().optional(),
    ogImageMedia: mediaRefSchema,
  }),
});

export const collectionFormDefaults = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  bannerMedia: null,
  thumbnailMedia: null,
  mobileBannerMedia: null,
  promoVideoMedia: null,
  status: 'draft',
  isFeatured: false,
  isVisible: true,
  order: 0,

  type: 'manual',
  assignmentType: 'manual',
  rules: { matchMode: 'all', conditions: [] },

  startDate: null,
  endDate: null,
  autoPublish: false,
  autoArchive: false,

  sortMode: 'manual',
  visibility: 'public',

  faqs: [],
  relatedCollections: [],
  parentCampaign: null,

  seo: { metaTitle: '', metaDescription: '', metaKeywords: '', canonicalUrl: '', ogImageMedia: null },
};
