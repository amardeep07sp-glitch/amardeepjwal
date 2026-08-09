import { z } from 'zod';
import { CATALOG_STATUSES } from '../../constants/catalog.js';
import {
  COLLECTION_TYPES,
  ASSIGNMENT_TYPES,
  RULE_FIELDS,
  RULE_OPERATORS,
  RULE_MATCH_MODES,
  MERCHANDISING_SORT_MODES,
  VISIBILITY_LEVELS,
} from './collection.constants.js';

const seoBody = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogImageMedia: z.string().optional().nullable(),
});

// A condition's `value` shape genuinely varies per rule field (a range
// object for price, an array for category/brand/tags/status, a boolean for
// featured, a plain stock-status string for stock) - this is the one place
// that variance is actually checked, Mongoose only stores it as Mixed.
const ruleConditionBody = z.object({
  field: z.enum(Object.values(RULE_FIELDS)),
  operator: z.enum(Object.values(RULE_OPERATORS)),
  value: z.union([
    z.string(),
    z.number(),
    z.boolean(),
    z.array(z.string()),
    z.object({ min: z.number().optional(), max: z.number().optional() }),
  ]),
});

const rulesBody = z.object({
  matchMode: z.enum(Object.values(RULE_MATCH_MODES)).default(RULE_MATCH_MODES.ALL),
  conditions: z.array(ruleConditionBody).default([]),
});

const faqBody = z.object({
  question: z.string().min(1, 'Question is required'),
  answer: z.string().min(1, 'Answer is required'),
});

// Kept as a plain ZodObject (not the refined version below) so
// updateCollectionSchema can still call .partial() on it - ZodEffects
// (what .refine() returns) doesn't support .partial().
const collectionBodyShape = z.object({
    name: z.string().min(1, 'Name is required'),
    slug: z.string().optional(),
    description: z.string().optional(),
    shortDescription: z.string().optional(),
    skuPrefix: z.string().optional(),
    bannerMedia: z.string().optional().nullable(),
    thumbnailMedia: z.string().optional().nullable(),
    mobileBannerMedia: z.string().optional().nullable(),
    promoVideoMedia: z.string().optional().nullable(),
    status: z.enum(Object.values(CATALOG_STATUSES)).default(CATALOG_STATUSES.DRAFT),
    isFeatured: z.boolean().optional(),
    isVisible: z.boolean().optional(),
    order: z.number().optional(),

    type: z.enum(Object.values(COLLECTION_TYPES)).default(COLLECTION_TYPES.MANUAL),
    assignmentType: z.enum(Object.values(ASSIGNMENT_TYPES)).default(ASSIGNMENT_TYPES.MANUAL),
    rules: rulesBody.optional(),

    startDate: z.coerce.date().optional().nullable(),
    endDate: z.coerce.date().optional().nullable(),
    autoPublish: z.boolean().optional(),
    autoArchive: z.boolean().optional(),

    sortMode: z.enum(Object.values(MERCHANDISING_SORT_MODES)).default(MERCHANDISING_SORT_MODES.MANUAL),
    visibility: z.enum(Object.values(VISIBILITY_LEVELS)).default(VISIBILITY_LEVELS.PUBLIC),

    faqs: z.array(faqBody).optional(),
    relatedCollections: z.array(z.string()).optional(),
    parentCampaign: z.string().optional().nullable(),

    seo: seoBody.optional(),
});

const collectionBody = collectionBodyShape
  .refine((data) => !data.startDate || !data.endDate || data.endDate >= data.startDate, {
    message: 'End date must be on or after the start date',
    path: ['endDate'],
  })
  .refine((data) => data.assignmentType !== ASSIGNMENT_TYPES.RULE_BASED || (data.rules?.conditions?.length ?? 0) > 0, {
    message: 'A rule-based collection needs at least one condition',
    path: ['rules', 'conditions'],
  });

export const createCollectionSchema = z.object({ body: collectionBody });

// Deliberately .partial() on the unrefined shape, not collectionBody - the
// cross-field checks above only make sense once every field they touch is
// actually present, which a partial update body doesn't guarantee (the
// tabbed admin form always submits Rules/Schedule as whole sub-objects
// together, never a lone field, so this isn't a real gap in practice).
export const updateCollectionSchema = z.object({
  params: z.object({ id: z.string() }),
  body: collectionBodyShape.partial(),
});

export const collectionIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listCollectionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(Object.values(CATALOG_STATUSES)).optional(),
    type: z.enum(Object.values(COLLECTION_TYPES)).optional(),
    isFeatured: z.coerce.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'order', 'createdAt', 'viewCount']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const bulkIdsSchema = z.object({
  body: z.object({ ids: z.array(z.string()).min(1, 'Select at least one collection') }),
});

export const bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'Select at least one collection'),
    status: z.enum(Object.values(CATALOG_STATUSES)),
  }),
});

export const previewRuleMatchesSchema = z.object({ body: rulesBody });

// Admin preview - the Merchandising/Preview tabs paging through a
// collection's already-resolved product list.
export const collectionProductsQuerySchema = z.object({
  params: z.object({ id: z.string() }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(48).default(12),
  }),
});

export const reorderCollectionProductsSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ orderedIds: z.array(z.string()).min(1) }),
});

// --- Public storefront schemas ----------------------------------------------

export const publicCollectionListQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(48).default(12),
    type: z.enum(Object.values(COLLECTION_TYPES)).optional(),
  }),
});

export const publicCollectionSlugSchema = z.object({ params: z.object({ slug: z.string() }) });

export const publicCollectionProductsQuerySchema = z.object({
  params: z.object({ slug: z.string() }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(48).default(12),
    randomSeed: z.coerce.number().optional(),
    sortBy: z.enum(Object.values(MERCHANDISING_SORT_MODES)).optional(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
  }),
});
