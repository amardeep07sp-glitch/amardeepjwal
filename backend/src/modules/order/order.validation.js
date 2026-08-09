import { z } from 'zod';
import { ORDER_STATUSES, PAYMENT_STATUSES, ORDER_SOURCES } from './order.constants.js';

const orderItemInput = z.object({
  product: z.string().min(1, 'Product is required'),
  variant: z.string().optional().nullable(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
});

export const createOrderSchema = z.object({
  body: z.object({
    customer: z.string().min(1, 'Customer is required'),
    billingAddress: z.string().optional().nullable(),
    shippingAddress: z.string().optional().nullable(),
    warehouse: z.string().optional().nullable(),
    currency: z.string().optional(),
    shippingCharge: z.coerce.number().min(0).optional(),
    handlingCharge: z.coerce.number().min(0).optional(),
    couponDiscount: z.coerce.number().min(0).optional(),
    notes: z.string().optional(),
    internalNotes: z.string().optional(),
    source: z.enum(Object.values(ORDER_SOURCES)).optional(),
    items: z.array(orderItemInput).min(1, 'At least one line item is required'),
  }),
});

export const orderIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listOrdersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    orderStatus: z.enum(Object.values(ORDER_STATUSES)).optional(),
    paymentStatus: z.enum(Object.values(PAYMENT_STATUSES)).optional(),
    source: z.enum(Object.values(ORDER_SOURCES)).optional(),
    warehouse: z.string().optional(),
    customer: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'orderNumber', 'grandTotal']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const cancelOrderSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ reason: z.string().optional() }),
});

export const itemIdsBodySchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ itemIds: z.array(z.string()).optional() }),
});

export const barcodeValueParamSchema = z.object({ params: z.object({ value: z.string().min(1) }) });

export const exportOrdersQuerySchema = z.object({
  query: z.object({
    format: z.enum(['csv', 'excel']).default('csv'),
    orderStatus: z.enum(Object.values(ORDER_STATUSES)).optional(),
    paymentStatus: z.enum(Object.values(PAYMENT_STATUSES)).optional(),
  }),
});
