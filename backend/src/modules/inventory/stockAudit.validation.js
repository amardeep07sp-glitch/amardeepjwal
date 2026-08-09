import { z } from 'zod';
import { AUDIT_STATUSES } from './inventory.constants.js';

export const createAuditSchema = z.object({
  body: z.object({
    inventory: z.string().min(1, 'Inventory record is required'),
    countedQuantity: z.number().min(0, 'Counted quantity cannot be negative'),
  }),
});

export const auditIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listAuditsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(AUDIT_STATUSES)).optional(),
    inventory: z.string().optional(),
  }),
});
