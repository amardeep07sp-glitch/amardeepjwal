import { z } from 'zod';

export const visitorIdParamSchema = z.object({ params: z.object({ visitorId: z.string().min(1) }) });
export const customerIdParamSchema = z.object({ params: z.object({ customerId: z.string().min(1) }) });

export const setConsentSchema = z.object({
  body: z.object({
    visitorId: z.string().min(1),
    analyticsConsent: z.boolean(),
    marketingConsent: z.boolean(),
  }),
});
