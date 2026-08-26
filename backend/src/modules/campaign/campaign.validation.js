import { z } from 'zod';
import { CAMPAIGN_TYPE_VALUES, CAMPAIGN_STATUS_VALUES } from './campaign.constants.js';

const campaignBody = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  slug: z.string().trim().optional(),
  description: z.string().trim().optional(),
  campaignType: z.enum(CAMPAIGN_TYPE_VALUES).optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date(),
  priority: z.coerce.number().optional(),
  budget: z.coerce.number().min(0).optional().nullable(),
  tags: z.array(z.string()).optional(),
});

export const createCampaignSchema = z.object({ body: campaignBody });

export const updateCampaignSchema = z.object({
  params: z.object({ id: z.string() }),
  body: campaignBody.partial(),
});

export const campaignIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listCampaignsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(CAMPAIGN_STATUS_VALUES).optional(),
    campaignType: z.enum(CAMPAIGN_TYPE_VALUES).optional(),
    search: z.string().trim().optional(),
  }),
});

export const setCampaignStatusSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ status: z.enum(CAMPAIGN_STATUS_VALUES) }),
});
