import { z } from 'zod';
import { PAGE_STATUSES } from '../../constants/cms.js';

const pageBody = z.object({
  title: z.string().min(1, 'Title is required'),
  slug: z.string().optional(),
  content: z.string().optional(),
  status: z.enum(Object.values(PAGE_STATUSES)).default(PAGE_STATUSES.DRAFT),
  heroMedia: z.string().optional().nullable(),
  metaTitle: z.string().optional(),
  metaDescription: z.string().optional(),
  ogImageMedia: z.string().optional().nullable(),
});

export const createPageSchema = z.object({ body: pageBody });

export const updatePageSchema = z.object({
  params: z.object({ id: z.string() }),
  body: pageBody.partial(),
});

export const pageIdSchema = z.object({ params: z.object({ id: z.string() }) });
