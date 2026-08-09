import { z } from 'zod';
import { ACCOUNTING_EVENT_TYPES, JOURNAL_STATUSES } from './accounting.constants.js';

const manualLineInput = z.object({
  account: z.string().min(1, 'Account is required'),
  debit: z.coerce.number().min(0).optional(),
  credit: z.coerce.number().min(0).optional(),
  narration: z.string().optional(),
});

export const createManualJournalSchema = z.object({
  body: z.object({
    date: z.string().optional(),
    narration: z.string().min(1, 'Narration is required'),
    lines: z.array(manualLineInput).min(2, 'A journal requires at least two lines'),
  }),
});

export const reverseJournalSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ reason: z.string().optional() }),
});

export const journalIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listJournalsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    eventType: z.enum(Object.values(ACCOUNTING_EVENT_TYPES)).optional(),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
    status: z.enum(Object.values(JOURNAL_STATUSES)).optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
  }),
});
