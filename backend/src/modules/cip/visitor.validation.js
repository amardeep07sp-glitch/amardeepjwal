import { z } from 'zod';

export const listVisitorsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(50),
  }),
});

export const visitorIdParamSchema = z.object({ params: z.object({ visitorId: z.string().min(1) }) });
