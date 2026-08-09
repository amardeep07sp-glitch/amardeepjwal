import { z } from 'zod';

export const ATTRIBUTE_TYPES = [
  { value: 'text', label: 'Text' },
  { value: 'number', label: 'Number' },
  { value: 'select', label: 'Select' },
  { value: 'multiselect', label: 'Multi Select' },
  { value: 'boolean', label: 'Boolean' },
  { value: 'date', label: 'Date' },
  { value: 'color', label: 'Color' },
  { value: 'image', label: 'Image' },
];

// Types whose selectable options are managed via the Attribute Values manager.
export const VALUE_BACKED_TYPES = ['select', 'multiselect', 'color', 'image'];

export const ACTIVE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const attributeSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  group: z.string().min(1, 'Attribute group is required'),
  type: z.enum(ATTRIBUTE_TYPES.map((t) => t.value)),
  isRequired: z.boolean().default(false),
  isFilterable: z.boolean().default(false),
  order: z.coerce.number().default(0),
  status: z.enum(['active', 'inactive']).default('active'),
});

export const attributeFormDefaults = {
  name: '',
  slug: '',
  group: '',
  type: 'text',
  isRequired: false,
  isFilterable: false,
  order: 0,
  status: 'active',
};
