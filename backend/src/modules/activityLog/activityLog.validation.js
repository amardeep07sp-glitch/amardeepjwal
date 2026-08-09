import { z } from 'zod';

export const listActivityQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    module: z.string().optional(),
    entityId: z.string().optional(),
    performedBy: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});
