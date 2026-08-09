import { z } from 'zod';
import { PO_STATUSES, PO_PAYMENT_STATUSES } from './purchase.constants.js';

const purchaseItemInput = z.object({
  product: z.string().min(1, 'Product is required'),
  variant: z.string().optional().nullable(),
  quantity: z.coerce.number().min(1, 'Quantity must be at least 1'),
  unitCost: z.coerce.number().min(0, 'Unit cost cannot be negative'),
  discount: z.coerce.number().min(0).optional(),
  tax: z.coerce.number().min(0).optional(),
});

export const createPurchaseOrderSchema = z.object({
  body: z.object({
    supplier: z.string().min(1, 'Supplier is required'),
    warehouse: z.string().optional().nullable(),
    shippingCharge: z.coerce.number().min(0).optional(),
    expectedDeliveryDate: z.string().optional().nullable(),
    internalNotes: z.string().optional(),
    items: z.array(purchaseItemInput).min(1, 'At least one line item is required'),
  }),
});

export const purchaseOrderIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listPurchaseOrdersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(PO_STATUSES)).optional(),
    paymentStatus: z.enum(Object.values(PO_PAYMENT_STATUSES)).optional(),
    supplier: z.string().optional(),
    warehouse: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'poNumber', 'grandTotal']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const cancelPurchaseOrderSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({ reason: z.string().optional() }),
});
