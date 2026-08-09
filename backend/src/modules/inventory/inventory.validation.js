import { z } from 'zod';
import { STOCK_STATUSES } from './inventory.constants.js';

export const listInventoryQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    warehouse: z.string().optional(),
    stockStatus: z.enum(Object.values(STOCK_STATUSES)).optional(),
    product: z.string().optional(),
    active: z.coerce.boolean().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['sku', 'availableQuantity', 'stockStatus', 'createdAt']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const inventoryIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const productIdParamSchema = z.object({ params: z.object({ productId: z.string() }) });

export const ledgerQuerySchema = z.object({
  params: z.object({ id: z.string() }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const updateInventorySettingsSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    minimumStock: z.number().min(0).optional(),
    maximumStock: z.number().min(0).optional(),
    reorderLevel: z.number().min(0).optional(),
    active: z.boolean().optional(),
    stockStatus: z.enum(Object.values(STOCK_STATUSES)).optional(),
  }),
});

export const reservationSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    quantity: z.number().positive('Quantity must be greater than zero'),
    referenceType: z.string().optional(),
    referenceId: z.string().optional(),
  }),
});
