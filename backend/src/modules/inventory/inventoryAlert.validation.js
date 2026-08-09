import { z } from 'zod';
import { ALERT_TYPES, ALERT_STATUSES } from './inventory.constants.js';

export const listAlertsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(ALERT_STATUSES)).optional(),
    type: z.enum(Object.values(ALERT_TYPES)).optional(),
  }),
});

export const alertIdSchema = z.object({ params: z.object({ id: z.string() }) });
