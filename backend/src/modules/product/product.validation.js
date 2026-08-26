import { z } from 'zod';
import { CATALOG_STATUSES, GENDERS, OCCASIONS, JEWELLERY_METALS, JEWELLERY_PURITIES_BY_METAL, GEMSTONE_TYPES } from '../../constants/catalog.js';

const seoBody = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogImageMedia: z.string().optional().nullable(),
});

const productBody = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  // Optional on create - left blank, the server auto-generates one from the
  // category/brand/collection's skuPrefix (see sku.generator.js). Ignored on
  // update (SKU is immutable after creation - see overrideSkuSchema).
  sku: z.string().optional(),
  shortDescription: z.string().optional(),
  description: z.string().optional(),
  status: z.enum(Object.values(CATALOG_STATUSES)).default(CATALOG_STATUSES.DRAFT),
  isFeatured: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().optional(),
  category: z.string().min(1, 'Category is required'),
  brand: z.string().optional().nullable(),
  collectionId: z.string().optional().nullable(),
  attributeGroups: z.array(z.string()).optional(),
  tags: z.array(z.string()).optional(),
  searchKeywords: z.array(z.string()).optional(),
  gender: z.enum(Object.values(GENDERS)).optional().nullable(),
  occasion: z.array(z.enum(Object.values(OCCASIONS))).optional(),
  metal: z.enum(Object.values(JEWELLERY_METALS)).optional().nullable(),
  purity: z.string().trim().optional(),
  gemstoneType: z.enum(Object.values(GEMSTONE_TYPES)).optional(),
  seo: seoBody.optional(),
});

// Purity is a real-world value tied to metal (24K only makes sense for
// gold, 925 only for silver) - checked here rather than in the Mongoose
// schema, which has no clean way to make one field's enum conditional on
// a sibling. Only enforced when BOTH fields are actually present in this
// particular payload, so a partial update touching just one of them isn't
// forced to resend the other.
const refinePurityMatchesMetal = (data, ctx) => {
  if (!data.metal || !data.purity) return;
  const allowed = JEWELLERY_PURITIES_BY_METAL[data.metal] ?? [];
  if (!allowed.includes(data.purity)) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['purity'],
      message: `"${data.purity}" is not a valid purity for ${data.metal} - expected one of: ${allowed.join(', ') || 'none'}`,
    });
  }
};

export const createProductSchema = z.object({ body: productBody.superRefine(refinePurityMatchesMetal) });

export const updateProductSchema = z.object({
  params: z.object({ id: z.string() }),
  body: productBody.partial().superRefine(refinePurityMatchesMetal),
});

export const productIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listProductsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(Object.values(CATALOG_STATUSES)).optional(),
    category: z.string().optional(),
    brand: z.string().optional(),
    collectionId: z.string().optional(),
    isFeatured: z.coerce.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'sku', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const nextSkuQuerySchema = z.object({
  query: z.object({
    category: z.string().optional(),
    brand: z.string().optional(),
    collectionId: z.string().optional(),
  }),
});

export const overrideSkuSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ sku: z.string().min(1, 'SKU is required') }),
});

export const bulkIdsSchema = z.object({
  body: z.object({ ids: z.array(z.string()).min(1, 'Select at least one product') }),
});

export const bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'Select at least one product'),
    status: z.enum(Object.values(CATALOG_STATUSES)),
  }),
});

// --- Public storefront schemas ----------------------------------------------

export const publicProductListQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(50).default(12),
  }),
});

const commaSeparatedList = () =>
  z
    .string()
    .optional()
    .transform((val) => (val ? val.split(',').filter(Boolean) : undefined));

export const publicProductPaginatedQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(48).default(12),
    category: z.string().optional(),
    categories: commaSeparatedList(),
    brand: z.string().optional(),
    brands: commaSeparatedList(),
    tags: commaSeparatedList(),
    minPrice: z.coerce.number().min(0).optional(),
    maxPrice: z.coerce.number().min(0).optional(),
    sortBy: z.enum(['featured', 'newest', 'price_asc', 'price_desc']).default('featured'),
    onSale: z.coerce.boolean().optional(),
    gender: z.enum(Object.values(GENDERS)).optional(),
    occasion: commaSeparatedList(),
    search: z.string().trim().min(1).optional(),
  }),
});

export const publicProductSlugSchema = z.object({ params: z.object({ slug: z.string() }) });

export const publicSearchSuggestQuerySchema = z.object({
  query: z.object({
    q: z.string().trim().min(1, 'Search term is required'),
    limit: z.coerce.number().min(1).max(10).default(6),
  }),
});

export const publicProductSimilarQuerySchema = z.object({
  params: z.object({ slug: z.string() }),
  query: z.object({
    limit: z.coerce.number().min(1).max(20).default(8),
  }),
});
