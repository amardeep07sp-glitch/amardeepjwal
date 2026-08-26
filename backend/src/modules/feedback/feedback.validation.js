import { z } from 'zod';
import { FEEDBACK_CATEGORY_VALUES } from './feedback.constants.js';

export const submitFeedbackSchema = z.object({
  body: z.object({
    rating: z.coerce.number().int().min(1).max(5).optional().nullable(),
    category: z.enum(FEEDBACK_CATEGORY_VALUES).optional(),
    message: z.string().trim().min(1, 'Feedback message is required'),
    pageContext: z.string().trim().optional(),
    orderId: z.string().optional().nullable(),
  }),
});

export const listFeedbackQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    category: z.enum(FEEDBACK_CATEGORY_VALUES).optional(),
  }),
});
