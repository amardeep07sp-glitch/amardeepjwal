import { z } from 'zod';
import { SUPPLIER_STATUSES } from './supplier.constants.js';

const bankDetailsInput = z.object({
  accountHolderName: z.string().optional(),
  accountNumber: z.string().optional(),
  ifscCode: z.string().optional(),
  bankName: z.string().optional(),
  branch: z.string().optional(),
});

const supplierBody = z.object({
  name: z.string().min(1, 'Supplier name is required'),
  contactPerson: z.string().optional(),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  phone: z.string().optional(),
  gstNumber: z.string().optional(),
  panNumber: z.string().optional(),
  bankDetails: bankDetailsInput.optional(),
  status: z.enum(Object.values(SUPPLIER_STATUSES)).optional(),
});

export const createSupplierSchema = z.object({ body: supplierBody });
export const updateSupplierSchema = z.object({ params: z.object({ id: z.string() }), body: supplierBody.partial() });
export const supplierIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listSuppliersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(SUPPLIER_STATUSES)).optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'name', 'supplierCode']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});
