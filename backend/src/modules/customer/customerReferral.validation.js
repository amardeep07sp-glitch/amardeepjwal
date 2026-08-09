import { z } from 'zod';
import { REFERRAL_STATUSES } from './customer.constants.js';

export const listReferralsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(REFERRAL_STATUSES)).optional(),
    referrer: z.string().optional(),
  }),
});

export const referralIdSchema = z.object({ params: z.object({ id: z.string() }) });
export const referrerIdParamSchema = z.object({ params: z.object({ referrerId: z.string() }) });

export const rewardReferralSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ rewardPoints: z.coerce.number().positive('Reward points must be greater than 0') }),
});
