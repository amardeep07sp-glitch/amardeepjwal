import { z } from 'zod';

export const updatePreferenceSchema = z.object({
  params: z.object({ customerId: z.string() }),
  body: z.object({
    preferredCategories: z.array(z.string()).optional(),
    preferredBrands: z.array(z.string()).optional(),
    metalPreference: z.string().optional(),
    purityPreference: z.string().optional(),
    budgetMin: z.coerce.number().min(0).optional(),
    budgetMax: z.coerce.number().min(0).optional(),
    communicationPreference: z
      .object({ email: z.boolean().optional(), whatsapp: z.boolean().optional(), sms: z.boolean().optional() })
      .optional(),
  }),
});

export const customerIdParamSchema = z.object({ params: z.object({ customerId: z.string() }) });
