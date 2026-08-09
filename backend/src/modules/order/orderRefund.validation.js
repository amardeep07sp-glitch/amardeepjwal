import { z } from 'zod';
import { REFUND_TYPES, REFUND_STATUSES } from './order.constants.js';

export const createRefundSchema = z.object({
  params: z.object({ orderId: z.string() }),
  body: z.object({
    type: z.enum(Object.values(REFUND_TYPES)),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    method: z.string().optional(),
    returnId: z.string().optional(),
  }),
});

export const processRefundSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ refundReference: z.string().optional() }),
});

export const refundIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listRefundsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(REFUND_STATUSES)).optional(),
  }),
});
