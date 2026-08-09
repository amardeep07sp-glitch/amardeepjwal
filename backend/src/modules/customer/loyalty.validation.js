import { z } from 'zod';
import { LOYALTY_TXN_TYPES } from './customer.constants.js';

export const loyaltyTransactionSchema = z.object({
  params: z.object({ customerId: z.string() }),
  body: z.object({
    type: z.enum(Object.values(LOYALTY_TXN_TYPES)),
    points: z.coerce.number().refine((v) => v !== 0, 'Points cannot be zero'),
    reason: z.string().min(1, 'Reason is required'),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    expiresAt: z.string().optional(),
  }),
});

export const customerIdParamSchema = z.object({ params: z.object({ customerId: z.string() }) });

export const loyaltyLedgerQuerySchema = z.object({
  params: z.object({ customerId: z.string() }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});
