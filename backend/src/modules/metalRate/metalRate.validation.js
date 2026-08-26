import { z } from 'zod';

export const updateMetalRateSchema = z.object({
  body: z.object({
    gold24k: z.coerce.number().min(0).optional(),
    gold22k: z.coerce.number().min(0).optional(),
    gold18k: z.coerce.number().min(0).optional(),
    silver: z.coerce.number().min(0).optional(),
    unit: z.string().trim().optional(),
  }),
});
