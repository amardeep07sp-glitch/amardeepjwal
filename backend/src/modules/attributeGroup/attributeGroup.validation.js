import { z } from 'zod';
import { ACTIVE_STATUSES } from '../../constants/catalog.js';

const attributeGroupBody = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  order: z.number().optional(),
  status: z.enum(Object.values(ACTIVE_STATUSES)).default(ACTIVE_STATUSES.ACTIVE),
});

export const createAttributeGroupSchema = z.object({ body: attributeGroupBody });

export const updateAttributeGroupSchema = z.object({
  params: z.object({ id: z.string() }),
  body: attributeGroupBody.partial(),
});

export const attributeGroupIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listAttributeGroupsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(Object.values(ACTIVE_STATUSES)).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});
