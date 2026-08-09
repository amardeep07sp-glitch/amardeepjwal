import { z } from 'zod';

export const inventoryStockQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(20),
    warehouse: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.string().optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
  }),
});

export const inventoryValuationQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(20),
    warehouse: z.string().optional(),
    format: z.enum(['csv', 'excel', 'pdf']).optional(),
  }),
});

export const stockMovementQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(200).default(20),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    inventory: z.string().optional(),
    movementType: z.string().optional(),
  }),
});

export const velocityQuerySchema = z.object({
  query: z.object({
    days: z.coerce.number().min(1).max(365).default(30),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});
