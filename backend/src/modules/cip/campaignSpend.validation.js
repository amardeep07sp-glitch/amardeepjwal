import { z } from 'zod';

export const createCampaignSpendSchema = z.object({
  body: z.object({
    utmCampaign: z.string().min(1, 'Campaign is required'),
    spend: z.coerce.number().positive('Spend must be greater than 0'),
    dateFrom: z.string().min(1),
    dateTo: z.string().min(1),
    notes: z.string().optional(),
  }),
});

export const campaignSpendIdSchema = z.object({ params: z.object({ id: z.string() }) });
