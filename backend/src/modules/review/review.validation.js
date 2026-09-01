import { z } from 'zod';
import { REVIEW_STATUS_VALUES, REVIEW_REPORT_REASON_VALUES } from './review.constants.js';

export const publicProductReviewsQuerySchema = z.object({
  params: z.object({ slug: z.string() }),
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(10),
  }),
});

export const featuredReviewsQuerySchema = z.object({
  query: z.object({
    limit: z.coerce.number().int().positive().max(12).default(6),
  }),
});

export const submitReviewSchema = z.object({
  params: z.object({ productId: z.string() }),
  body: z.object({
    rating: z.coerce.number().int().min(1, 'Rating is required').max(5),
    title: z.string().trim().max(120).optional(),
    comment: z.string().trim().max(2000).optional(),
  }),
});

export const productIdParamSchema = z.object({ params: z.object({ productId: z.string() }) });

export const listReviewsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    status: z.enum(REVIEW_STATUS_VALUES).optional(),
    productId: z.string().optional(),
  }),
});

export const moderateReviewSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ status: z.enum(['approved', 'rejected']) }),
});

export const reviewIdParamSchema = z.object({ params: z.object({ id: z.string() }) });

export const reportedReviewsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});

export const reportIdParamSchema = z.object({ params: z.object({ reportId: z.string() }) });

export const reportReviewSchema = z.object({
  params: z.object({ reviewId: z.string() }),
  body: z.object({
    reason: z.enum(REVIEW_REPORT_REASON_VALUES),
    description: z.string().trim().max(1000).optional(),
  }),
});
