import { z } from 'zod';

const taxRateBody = z.object({
  name: z.string().min(1, 'Name is required'),
  rate: z.coerce.number().min(0),
  cgstRate: z.coerce.number().min(0).optional(),
  sgstRate: z.coerce.number().min(0).optional(),
  igstRate: z.coerce.number().min(0).optional(),
  isDefault: z.boolean().optional(),
  active: z.boolean().optional(),
});

export const createTaxRateSchema = z.object({ body: taxRateBody });
export const updateTaxRateSchema = z.object({ params: z.object({ id: z.string() }), body: taxRateBody.partial() });
export const taxRateIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const taxSummaryQuerySchema = z.object({
  query: z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }),
});
