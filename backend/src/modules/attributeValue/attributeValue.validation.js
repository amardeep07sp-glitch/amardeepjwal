import { z } from 'zod';
import { ACTIVE_STATUSES } from '../../constants/catalog.js';

const attributeValueBody = z.object({
  attribute: z.string().min(1, 'Attribute is required'),
  value: z.string().min(1, 'Value is required'),
  hexColor: z.string().optional(),
  imageUrl: z.string().optional(),
  order: z.number().optional(),
  status: z.enum(Object.values(ACTIVE_STATUSES)).default(ACTIVE_STATUSES.ACTIVE),
});

export const createAttributeValueSchema = z.object({ body: attributeValueBody });

export const updateAttributeValueSchema = z.object({
  params: z.object({ id: z.string() }),
  body: attributeValueBody.partial(),
});

export const attributeValueIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listAttributeValuesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    attribute: z.string().optional(),
    status: z.enum(Object.values(ACTIVE_STATUSES)).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['value', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const attributeIdQuerySchema = z.object({
  params: z.object({ attributeId: z.string() }),
});
