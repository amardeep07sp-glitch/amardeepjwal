import { z } from 'zod';

export const dateRangeQuerySchema = z.object({
  query: z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }),
});

export const asOfDateQuerySchema = z.object({
  query: z.object({ asOfDate: z.string().optional() }),
});

export const dayBookQuerySchema = z.object({
  query: z.object({ date: z.string().optional() }),
});
