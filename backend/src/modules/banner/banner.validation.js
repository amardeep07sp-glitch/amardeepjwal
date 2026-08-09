import { z } from 'zod';
import { BANNER_POSITIONS } from '../../constants/cms.js';

const bannerBody = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  ctaLabel: z.string().optional(),
  primaryMedia: z.string().optional().nullable(),
  linkUrl: z.string().optional(),
  altText: z.string().optional(),
  position: z.enum(Object.values(BANNER_POSITIONS)).default(BANNER_POSITIONS.HOMEPAGE_HERO),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
  startDate: z.string().datetime().optional().nullable(),
  endDate: z.string().datetime().optional().nullable(),
});

export const createBannerSchema = z.object({ body: bannerBody });

export const updateBannerSchema = z.object({
  params: z.object({ id: z.string() }),
  body: bannerBody.partial(),
});

export const bannerIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const publicBannerQuerySchema = z.object({
  query: z.object({
    position: z.enum(Object.values(BANNER_POSITIONS)).optional(),
  }),
});
