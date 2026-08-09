import { z } from 'zod';

export const ACTIVE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const attributeGroupSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  order: z.coerce.number().default(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const attributeGroupFormDefaults = {
  name: '',
  slug: '',
  description: '',
  order: 0,
  status: 'active',
};
