import { z } from 'zod';
import { HOMEPAGE_SECTION_TYPES } from '../../constants/cms.js';

const homepageSectionBody = z.object({
  internalTitle: z.string().min(1, 'Internal title is required'),
  type: z.enum(Object.values(HOMEPAGE_SECTION_TYPES)),
  banner: z.string().optional().nullable(),
  heading: z.string().optional(),
  body: z.string().optional(),
  primaryMedia: z.string().optional().nullable(),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
});

export const createHomepageSectionSchema = z.object({ body: homepageSectionBody });

export const updateHomepageSectionSchema = z.object({
  params: z.object({ id: z.string() }),
  body: homepageSectionBody.partial(),
});

export const homepageSectionIdSchema = z.object({ params: z.object({ id: z.string() }) });
