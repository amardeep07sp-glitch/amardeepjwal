import { z } from 'zod';

const grnLineInput = z.object({
  purchaseItem: z.string().min(1, 'Purchase item is required'),
  receivedQuantity: z.coerce.number().min(1, 'Received quantity must be at least 1'),
});

export const receiveGoodsSchema = z.object({
  params: z.object({ purchaseOrderId: z.string() }),
  body: z.object({
    items: z.array(grnLineInput).min(1, 'At least one line item is required'),
    notes: z.string().optional(),
  }),
});

export const purchaseOrderIdParamSchema = z.object({ params: z.object({ purchaseOrderId: z.string() }) });
