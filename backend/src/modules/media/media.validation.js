import { z } from 'zod';
import { MEDIA_ENTITY_TYPES, MEDIA_STATUSES, MEDIA_VISIBILITY } from './media.constants.js';

// multipart/form-data fields always arrive as strings, so booleans need
// explicit string->boolean coercion (z.coerce.boolean() would treat the
// literal string "false" as truthy, which is wrong here).
const booleanFormField = z
  .enum(['true', 'false'])
  .optional()
  .transform((value) => value === 'true');

export const uploadMediaSchema = z.object({
  body: z.object({
    entityType: z.enum(Object.values(MEDIA_ENTITY_TYPES)),
    entityId: z.string().min(1, 'entityId is required'),
    variantId: z.string().optional(),
    altText: z.string().optional(),
    caption: z.string().optional(),
    isFeatured: booleanFormField,
    isFeaturedVideo: booleanFormField,
  }),
});

export const listMediaQuerySchema = z.object({
  query: z.object({
    entityType: z.enum(Object.values(MEDIA_ENTITY_TYPES)),
    entityId: z.string().min(1, 'entityId is required'),
    variantId: z.string().optional(),
    type: z.string().optional(),
    status: z.enum(Object.values(MEDIA_STATUSES)).optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(50),
    sortBy: z.enum(['sortOrder', 'createdAt']).default('sortOrder'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const mediaLibraryQuerySchema = z.object({
  query: z.object({
    entityType: z.enum(Object.values(MEDIA_ENTITY_TYPES)).optional(),
    type: z.string().optional(),
    status: z.enum(Object.values(MEDIA_STATUSES)).optional(),
    isFeatured: z.coerce.boolean().optional(),
    isFeaturedVideo: z.coerce.boolean().optional(),
    usage: z.enum(['used', 'unused']).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'updatedAt']).default('createdAt'),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(24),
  }),
});

export const mediaIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const updateMediaMetadataSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    altText: z.string().optional(),
    caption: z.string().optional(),
    isFeatured: z.boolean().optional(),
    isFeaturedVideo: z.boolean().optional(),
    visibility: z.enum(Object.values(MEDIA_VISIBILITY)).optional(),
    sortOrder: z.number().optional(),
  }),
});

export const reorderMediaSchema = z.object({
  body: z.object({
    items: z.array(z.object({ id: z.string(), sortOrder: z.number() })).min(1, 'No items to reorder'),
  }),
});

export const bulkMediaIdsSchema = z.object({
  body: z.object({ ids: z.array(z.string()).min(1, 'Select at least one media item') }),
});

export const bulkDeleteMediaSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'Select at least one media item'),
    force: z.boolean().optional(),
  }),
});

export const deleteMediaSchema = z.object({
  params: z.object({ id: z.string() }),
  query: z.object({ force: z.coerce.boolean().optional() }),
});
