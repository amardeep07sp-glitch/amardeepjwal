import { z } from 'zod';
import { CATALOG_STATUSES } from '../../../constants/catalog.js';

const variantAttributePair = z.object({
  attribute: z.string().min(1),
  value: z.string().min(1),
});

const variantBody = z.object({
  sku: z.string().min(1, 'SKU is required'),
  slug: z.string().optional(),
  status: z.enum(Object.values(CATALOG_STATUSES)).default(CATALOG_STATUSES.DRAFT),
  isVisible: z.boolean().default(true),
  order: z.number().default(0),
  priceOverride: z.number().min(0).nullable().optional(),
  weightOverride: z.number().min(0).nullable().optional(),
  isFeatured: z.boolean().default(false),
  isDefault: z.boolean().default(false),
  attributes: z.array(variantAttributePair).default([]),
});

export const createVariantSchema = z.object({
  params: z.object({ id: z.string() }),
  body: variantBody,
});

export const updateVariantSchema = z.object({
  params: z.object({ id: z.string(), variantId: z.string() }),
  body: variantBody.partial(),
});

export const variantIdSchema = z.object({
  params: z.object({ id: z.string(), variantId: z.string() }),
});

export const listVariantsQuerySchema = z.object({
  params: z.object({ id: z.string() }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(20),
    status: z.enum(Object.values(CATALOG_STATUSES)).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['sku', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const generateVariantsSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    attributes: z
      .array(
        z.object({
          attributeId: z.string().min(1),
          valueIds: z.array(z.string().min(1)).min(1, 'Select at least one value'),
        })
      )
      .min(1, 'Select at least one attribute'),
    skuPrefix: z.string().optional(),
  }),
});

export const bulkVariantIdsSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ ids: z.array(z.string()).min(1, 'Select at least one variant') }),
});

export const bulkVariantStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    ids: z.array(z.string()).min(1, 'Select at least one variant'),
    status: z.enum(Object.values(CATALOG_STATUSES)),
  }),
});
