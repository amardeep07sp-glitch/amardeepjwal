import { z } from 'zod';
import { CATALOG_STATUSES } from '../../constants/catalog.js';

const seoBody = z.object({
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  metaKeywords: z.string().optional(),
  canonicalUrl: z.string().optional(),
  ogImageMedia: z.string().optional().nullable(),
});

const categoryBody = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  skuPrefix: z.string().optional(),
  parent: z.string().optional().nullable(),
  iconMedia: z.string().optional().nullable(),
  bannerMedia: z.string().optional().nullable(),
  thumbnailMedia: z.string().optional().nullable(),
  status: z.enum(Object.values(CATALOG_STATUSES)).default(CATALOG_STATUSES.DRAFT),
  isFeatured: z.boolean().optional(),
  showInNavbar: z.boolean().optional(),
  showOnHomepage: z.boolean().optional(),
  isVisible: z.boolean().optional(),
  order: z.number().optional(),
  seo: seoBody.optional(),
});

export const createCategorySchema = z.object({ body: categoryBody });

export const updateCategorySchema = z.object({
  params: z.object({ id: z.string() }),
  body: categoryBody.partial(),
});

export const categoryIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listCategoriesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(Object.values(CATALOG_STATUSES)).optional(),
    parent: z.string().optional(),
    isFeatured: z.coerce.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const categoryTreeQuerySchema = z.object({
  query: z.object({
    status: z.enum(Object.values(CATALOG_STATUSES)).optional(),
  }),
});

export const updateStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ status: z.enum(Object.values(CATALOG_STATUSES)) }),
});

export const reorderCategoriesSchema = z.object({
  body: z.object({
    updates: z
      .array(
        z.object({
          id: z.string(),
          order: z.number(),
          parent: z.string().nullable().optional(),
        })
      )
      .min(1, 'At least one update is required'),
  }),
});

export const bulkIdsSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'Select at least one category'),
  }),
});

export const bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'Select at least one category'),
    status: z.enum(Object.values(CATALOG_STATUSES)),
  }),
});

export const trashQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
});

export const autocompleteQuerySchema = z.object({
  query: z.object({
    q: z.string().min(1, 'Search term is required'),
    limit: z.coerce.number().min(1).max(20).default(10),
  }),
});

export const mergeCategorySchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ targetId: z.string().min(1, 'Target category is required') }),
});

export const analyticsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    sortBy: z.enum(['viewCount', 'clickCount', 'productCount']).default('viewCount'),
  }),
});

export const publicSlugSchema = z.object({ params: z.object({ slug: z.string() }) });

export const publicCategoryListQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().min(1).max(50).default(10),
  }),
});

export const publicCategoryPaginatedQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(48).default(20),
  }),
});
