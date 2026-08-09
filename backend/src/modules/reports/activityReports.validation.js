import { z } from 'zod';

export const activityQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(20),
    module: z.string().optional(),
    entityId: z.string().optional(),
    performedBy: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});

export const timelineReportQuerySchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    limit: z.coerce.number().min(1).max(500).default(100),
  }),
});
