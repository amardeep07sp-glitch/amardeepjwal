import { z } from 'zod';

const categoryBody = z.object({
  name: z.string().min(1, 'Name is required'),
  defaultAccount: z.string().optional().nullable(),
  active: z.boolean().optional(),
});

export const createExpenseCategorySchema = z.object({ body: categoryBody });
export const updateExpenseCategorySchema = z.object({ params: z.object({ id: z.string() }), body: categoryBody.partial() });
export const expenseCategoryIdSchema = z.object({ params: z.object({ id: z.string() }) });
