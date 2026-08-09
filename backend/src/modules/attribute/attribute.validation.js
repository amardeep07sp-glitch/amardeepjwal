import { z } from 'zod';
import { ACTIVE_STATUSES } from '../../constants/catalog.js';
import { ATTRIBUTE_TYPES } from '../../constants/attribute.js';

const attributeBody = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  group: z.string().min(1, 'Attribute group is required'),
  type: z.enum(Object.values(ATTRIBUTE_TYPES)),
  isRequired: z.boolean().optional(),
  isFilterable: z.boolean().optional(),
  order: z.number().optional(),
  status: z.enum(Object.values(ACTIVE_STATUSES)).default(ACTIVE_STATUSES.ACTIVE),
});

export const createAttributeSchema = z.object({ body: attributeBody });

export const updateAttributeSchema = z.object({
  params: z.object({ id: z.string() }),
  body: attributeBody.partial(),
});

export const attributeIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listAttributesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(Object.values(ACTIVE_STATUSES)).optional(),
    group: z.string().optional(),
    type: z.enum(Object.values(ATTRIBUTE_TYPES)).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'order', 'createdAt']).default('order'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});
