import { z } from 'zod';
import { PURCHASE_RETURN_ACTIONS, PURCHASE_RETURN_STATUSES } from './purchase.constants.js';

const returnLineInput = z.object({
  purchaseItem: z.string().min(1, 'Purchase item is required'),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

export const requestReturnSchema = z.object({
  params: z.object({ purchaseOrderId: z.string() }),
  body: z.object({
    items: z.array(returnLineInput).min(1, 'At least one line item is required'),
    reason: z.string().optional(),
    action: z.enum(Object.values(PURCHASE_RETURN_ACTIONS)),
  }),
});

export const purchaseOrderIdParamSchema = z.object({ params: z.object({ purchaseOrderId: z.string() }) });
export const returnIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listReturnsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(PURCHASE_RETURN_STATUSES)).optional(),
    supplier: z.string().optional(),
  }),
});
