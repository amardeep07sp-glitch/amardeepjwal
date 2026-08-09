import { z } from 'zod';
import { ACCOUNT_TYPES } from './accounting.constants.js';

const accountBody = z.object({
  code: z.string().min(1, 'Account code is required'),
  name: z.string().min(1, 'Account name is required'),
  type: z.enum(Object.values(ACCOUNT_TYPES)),
  parent: z.string().optional().nullable(),
  description: z.string().optional(),
  openingBalance: z.coerce.number().optional(),
  active: z.boolean().optional(),
});

export const createAccountSchema = z.object({ body: accountBody });
export const updateAccountSchema = z.object({
  params: z.object({ id: z.string() }),
  body: accountBody.partial().omit({ openingBalance: true }),
});
export const accountIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listAccountsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(50),
    type: z.enum(Object.values(ACCOUNT_TYPES)).optional(),
    active: z.coerce.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['code', 'name', 'createdAt']).default('code'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});
