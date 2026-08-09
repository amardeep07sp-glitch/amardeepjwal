import { z } from 'zod';
import { WAREHOUSE_STATUSES } from './inventory.constants.js';

const warehouseBody = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  status: z.enum(Object.values(WAREHOUSE_STATUSES)).default(WAREHOUSE_STATUSES.ACTIVE),
  isDefault: z.boolean().optional(),
});

export const createWarehouseSchema = z.object({ body: warehouseBody });

export const updateWarehouseSchema = z.object({
  params: z.object({ id: z.string() }),
  body: warehouseBody.partial(),
});

export const warehouseIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listWarehousesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
    status: z.enum(Object.values(WAREHOUSE_STATUSES)).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['name', 'code', 'createdAt']).default('name'),
    sortOrder: z.enum(['asc', 'desc']).default('asc'),
  }),
});

export const bulkWarehouseIdsSchema = z.object({
  body: z.object({ ids: z.array(z.string()).min(1, 'Select at least one warehouse') }),
});

export const bulkWarehouseStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'Select at least one warehouse'),
    status: z.enum(Object.values(WAREHOUSE_STATUSES)),
  }),
});
