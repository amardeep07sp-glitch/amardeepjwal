import { z } from 'zod';
import { mediaRefSchema } from '../../media/mediaSchema';

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

export const brandSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  logoMedia: mediaRefSchema,
  bannerMedia: mediaRefSchema,
  country: z.string().optional(),
  website: z.string().optional(),
  status: z.enum(CATALOG_STATUSES.map((s) => s.value)).default('draft'),
  isFeatured: z.boolean().default(false),
  isVisible: z.boolean().default(true),
  order: z.coerce.number().default(0),
  seo: z.object({
    metaTitle: z.string().optional(),
    metaDescription: z.string().optional(),
    metaKeywords: z.string().optional(),
    canonicalUrl: z.string().optional(),
    ogImageMedia: mediaRefSchema,
  }),
});

export const brandFormDefaults = {
  name: '',
  slug: '',
  description: '',
  logoMedia: null,
  bannerMedia: null,
  country: '',
  website: '',
  status: 'draft',
  isFeatured: false,
  isVisible: true,
  order: 0,
  seo: { metaTitle: '', metaDescription: '', metaKeywords: '', canonicalUrl: '', ogImageMedia: null },
};
