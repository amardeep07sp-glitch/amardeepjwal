import { z } from 'zod';
import { mediaRefSchema } from '../../media/mediaSchema';

export const CATEGORY_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'hidden', label: 'Hidden' },
  { value: 'archived', label: 'Archived' },
];

export const NO_PARENT_VALUE = 'none';

export const categorySchema = z.object({
  name: z.string().min(1, 'Name is required'),
  slug: z.string().optional(),
  description: z.string().optional(),
  shortDescription: z.string().optional(),
  skuPrefix: z.string().optional(),
  parent: z.string().optional(),
  iconMedia: mediaRefSchema,
  bannerMedia: mediaRefSchema,
  thumbnailMedia: mediaRefSchema,
  status: z.enum(CATEGORY_STATUSES.map((s) => s.value)).default('draft'),
  isFeatured: z.boolean().default(false),
  showInNavbar: z.boolean().default(false),
  showOnHomepage: z.boolean().default(false),
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

export const categoryFormDefaults = {
  name: '',
  slug: '',
  description: '',
  shortDescription: '',
  skuPrefix: '',
  parent: NO_PARENT_VALUE,
  iconMedia: null,
  bannerMedia: null,
  thumbnailMedia: null,
  status: 'draft',
  isFeatured: false,
  showInNavbar: false,
  showOnHomepage: false,
  isVisible: true,
  order: 0,
  seo: { metaTitle: '', metaDescription: '', metaKeywords: '', canonicalUrl: '', ogImageMedia: null },
};
