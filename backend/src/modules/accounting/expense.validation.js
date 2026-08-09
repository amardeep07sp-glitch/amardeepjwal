import { z } from 'zod';
import { EXPENSE_STATUSES, EXPENSE_PAYMENT_METHODS } from './accounting.constants.js';

export const createExpenseSchema = z.object({
  body: z.object({
    category: z.string().min(1, 'Category is required'),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    description: z.string().optional(),
    date: z.string().optional(),
    method: z.enum(Object.values(EXPENSE_PAYMENT_METHODS)).optional(),
    attachments: z.array(z.string()).optional(),
  }),
});

export const expenseIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const rejectExpenseSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ reason: z.string().optional() }),
});

export const listExpensesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(EXPENSE_STATUSES)).optional(),
    category: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
  }),
});
