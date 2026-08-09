import { z } from 'zod';

export const listSessionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(50),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});

export const endSessionSchema = z.object({ params: z.object({ sessionId: z.string().min(1) }) });
