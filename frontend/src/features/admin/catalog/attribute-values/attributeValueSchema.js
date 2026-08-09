import { z } from 'zod';

export const attributeValueSchema = z.object({
  attribute: z.string().min(1),
  value: z.string().min(1, 'Value is required'),
  hexColor: z.string().optional(),
  imageUrl: z.string().optional(),
  order: z.coerce.number().default(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const attributeValueFormDefaults = {
  attribute: '',
  value: '',
  hexColor: '',
  imageUrl: '',
  order: 0,
  status: 'active',
};
