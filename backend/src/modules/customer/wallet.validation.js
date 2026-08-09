import { z } from 'zod';
import { WALLET_TXN_TYPES } from './customer.constants.js';

export const walletTransactionSchema = z.object({
  params: z.object({ customerId: z.string() }),
  body: z.object({
    type: z.enum(Object.values(WALLET_TXN_TYPES)),
    amount: z.coerce.number().refine((v) => v !== 0, 'Amount cannot be zero'),
    reason: z.string().min(1, 'Reason is required'),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
  }),
});

export const customerIdParamSchema = z.object({ params: z.object({ customerId: z.string() }) });

export const walletLedgerQuerySchema = z.object({
  params: z.object({ customerId: z.string() }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});
