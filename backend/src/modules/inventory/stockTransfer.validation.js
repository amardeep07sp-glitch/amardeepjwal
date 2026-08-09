import { z } from 'zod';
import { TRANSFER_STATUSES } from './inventory.constants.js';

export const requestTransferSchema = z.object({
  body: z.object({
    inventory: z.string().min(1, 'Inventory record is required'),
    fromWarehouse: z.string().min(1, 'Source warehouse is required'),
    toWarehouse: z.string().min(1, 'Destination warehouse is required'),
    quantity: z.number().positive('Quantity must be greater than zero'),
  }),
});

export const transferIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listTransfersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(TRANSFER_STATUSES)).optional(),
  }),
});
