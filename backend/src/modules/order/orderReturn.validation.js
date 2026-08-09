import { z } from 'zod';
import { RETURN_STATUSES } from './order.constants.js';

export const requestReturnSchema = z.object({
  params: z.object({ orderId: z.string() }),
  body: z.object({
    items: z
      .array(z.object({ orderItem: z.string().min(1), returnQuantity: z.coerce.number().min(1) }))
      .min(1, 'At least one item is required'),
    reason: z.string().optional(),
  }),
});

export const returnIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listReturnsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(RETURN_STATUSES)).optional(),
  }),
});
