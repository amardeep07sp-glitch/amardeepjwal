import { z } from 'zod';

export const accountLedgerQuerySchema = z.object({
  params: z.object({ accountId: z.string() }),
  query: z.object({ dateFrom: z.string().optional(), dateTo: z.string().optional() }),
});

export const trialBalanceQuerySchema = z.object({
  query: z.object({ asOfDate: z.string().optional() }),
});
