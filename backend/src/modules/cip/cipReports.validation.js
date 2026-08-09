import { z } from 'zod';

// The Filter Engine's date-range contract, shared by every CIP report -
// mirrors reports/reportFilters.util.js's convention exactly.
export const dateRangeQuerySchema = z.object({
  query: z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }),
});

export const dateRangeWithLimitQuerySchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    limit: z.coerce.number().min(1).max(200).optional(),
  }),
});

export const productPerformanceQuerySchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(20),
  }),
});

export const trendingSearchesQuerySchema = z.object({
  query: z.object({ hours: z.coerce.number().min(1).max(720).optional(), limit: z.coerce.number().min(1).max(100).optional() }),
});

export const commonPathsQuerySchema = z.object({
  query: z.object({
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    sampleSize: z.coerce.number().min(1).max(5000).optional(),
    limit: z.coerce.number().min(1).max(100).optional(),
  }),
});

export const sessionIdParamSchema = z.object({ params: z.object({ sessionId: z.string().min(1) }) });
