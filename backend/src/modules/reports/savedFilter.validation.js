import { z } from 'zod';

export const createSavedFilterSchema = z.object({
  body: z.object({
    name: z.string().min(1, 'Name is required'),
    reportKey: z.string().min(1, 'reportKey is required'),
    filters: z.record(z.string(), z.any()).optional(),
  }),
});

export const listSavedFiltersQuerySchema = z.object({
  query: z.object({ reportKey: z.string().min(1) }),
});

export const savedFilterIdSchema = z.object({ params: z.object({ id: z.string() }) });
