import { z } from 'zod';

export const WAREHOUSE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const STATUS_BADGE_VARIANTS = {
  active: 'success',
  inactive: 'secondary',
};

export const warehouseSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  code: z.string().min(1, 'Code is required'),
  address: z.string().optional(),
  contactPerson: z.string().optional(),
  phone: z.string().optional(),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  status: z.enum(WAREHOUSE_STATUSES.map((s) => s.value)).default('active'),
  isDefault: z.boolean().default(false),
});

export const warehouseFormDefaults = {
  name: '',
  code: '',
  address: '',
  contactPerson: '',
  phone: '',
  email: '',
  status: 'active',
  isDefault: false,
};
