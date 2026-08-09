import { z } from 'zod';
import { PAYMENT_METHODS } from './order.constants.js';

const manualMethods = Object.values(PAYMENT_METHODS).filter((m) => m !== PAYMENT_METHODS.RAZORPAY);

export const recordManualPaymentSchema = z.object({
  params: z.object({ orderId: z.string() }),
  body: z.object({
    method: z.enum(manualMethods),
    amount: z.coerce.number().positive('Amount must be greater than 0'),
    transactionReference: z.string().optional(),
  }),
});

export const initiateRazorpaySchema = z.object({ params: z.object({ orderId: z.string() }) });

export const verifyRazorpaySchema = z.object({
  body: z.object({
    razorpayOrderId: z.string().min(1),
    razorpayPaymentId: z.string().min(1),
    razorpaySignature: z.string().min(1),
  }),
});

export const orderIdParamSchema = z.object({ params: z.object({ orderId: z.string() }) });
