import { z } from 'zod';
import { mediaRefSchema } from '../../media/mediaSchema';

export const pageSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(['draft', 'published']).default('draft'),
  heroMedia: mediaRefSchema,
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImageMedia: mediaRefSchema,
});

export const pageFormDefaults = {
  title: '',
  slug: '',
  content: '',
  status: 'draft',
  heroMedia: null,
  metaTitle: '',
  metaDescription: '',
  ogImageMedia: null,
};
