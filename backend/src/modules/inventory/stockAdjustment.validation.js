import { z } from 'zod';
import { ADJUSTMENT_TYPES, ADJUSTMENT_STATUSES } from './inventory.constants.js';

export const createAdjustmentSchema = z.object({
  body: z.object({
    inventory: z.string().min(1, 'Inventory record is required'),
    type: z.enum(Object.values(ADJUSTMENT_TYPES)),
    quantity: z.number().positive('Quantity must be greater than zero'),
    reason: z.string().min(1, 'Reason is required'),
  }),
});

export const adjustmentIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listAdjustmentsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(ADJUSTMENT_STATUSES)).optional(),
    inventory: z.string().optional(),
  }),
});
