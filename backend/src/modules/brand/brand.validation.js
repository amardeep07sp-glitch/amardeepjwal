import { z } from 'zod';
import { CATALOG_STATUSES } from '../../constants/catalog.js';

const seoBody = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogImageMedia: z.string().optional().nullable(),
});

const brandBody = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  skuPrefix: z.string().optional(),
  logoMedia: z.string().optional().nullable(),
  bannerMedia: z.string().optional().nullable(),
  country: z.string().optional(),
  website: z.string().optional(),
  status: z.enum(Object.values(CATALOG_STATUSES)).default(CATALOG_STATUSES.DRAFT),
  isFeatured: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().optional(),
  seo: seoBody.optional(),
});

export const createBrandSchema = z.object({ body: brandBody });

export const updateBrandSchema = z.object({
  params: z.object({ id: z.string() }),
  body: brandBody.partial(),
});

export const brandIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listBrandsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(Object.values(CATALOG_STATUSES)).optional(),
    isFeatured: z.coerce.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const bulkIdsSchema = z.object({
  body: z.object({ ids: z.array(z.string()).min(1, 'Select at least one brand') }),
});

export const bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'Select at least one brand'),
    status: z.enum(Object.values(CATALOG_STATUSES)),
  }),
});

export const publicBrandSlugSchema = z.object({ params: z.object({ slug: z.string() }) });

export const publicBrandPaginatedQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(48).default(20),
  }),
});

export const publicFeaturedBrandsQuerySchema = z.object({
  query: z.object({ limit: z.coerce.number().min(1).max(20).default(8) }),
});
