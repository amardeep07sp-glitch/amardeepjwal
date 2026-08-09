import { z } from 'zod';

export const CATALOG_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
];

export const STATUS_BADGE_VARIANTS = {
  draft: 'secondary',
  published: 'success',
  hidden: 'warning',
  archived: 'destructive',
};

export const variantSchema = z.object({
  sku: z.string().min(1, 'SKU is required'),
  status: z.enum(['draft', 'published', 'hidden', 'archived']).default('draft'),
  isVisible: z.boolean().default(true),
  order: z.coerce.number().default(0),
  priceOverride: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  weightOverride: z.union([z.coerce.number().min(0), z.literal('')]).optional(),
  isFeatured: z.boolean().default(false),
  isDefault: z.boolean().default(false),
});

export const variantFormDefaults = {
  sku: '',
  status: 'draft',
  isVisible: true,
  order: 0,
  priceOverride: '',
  weightOverride: '',
  isFeatured: false,
  isDefault: false,
};

export const describeAttributes = (attributes = []) =>
  attributes.map((pair) => `${pair.attribute?.name ?? '—'}: ${pair.value?.value ?? '—'}`).join(', ');
