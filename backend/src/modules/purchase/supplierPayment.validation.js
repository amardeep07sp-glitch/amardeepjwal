import { z } from 'zod';
import { PURCHASE_PAYMENT_METHODS } from './purchase.constants.js';

export const recordPaymentSchema = z.object({
  params: z.object({ supplierId: z.string() }),
  body: z.object({
    purchaseOrder: z.string().optional().nullable(),
    method: z.enum(Object.values(PURCHASE_PAYMENT_METHODS)),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    transactionReference: z.string().optional(),
  }),
});

export const supplierIdParamSchema = z.object({ params: z.object({ supplierId: z.string() }) });
export const purchaseOrderIdParamSchema = z.object({ params: z.object({ purchaseOrderId: z.string() }) });
export const paymentIdSchema = z.object({ params: z.object({ id: z.string() }) });
