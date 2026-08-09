import { z } from 'zod';
import { mediaRefSchema } from '../../media/mediaSchema';

export const BANNER_POSITIONS = [
  { value: 'homepage_hero', label: 'Homepage hero' },
  { value: 'homepage_secondary', label: 'Homepage secondary' },
  { value: 'sitewide_announcement', label: 'Sitewide announcement' },
];

export const bannerSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  subtitle: z.string().optional(),
  description: z.string().optional(),
  ctaLabel: z.string().optional(),
  primaryMedia: mediaRefSchema,
  linkUrl: z.string().optional(),
  altText: z.string().optional(),
  position: z.enum(BANNER_POSITIONS.map((p) => p.value)).default('homepage_hero'),
  order: z.coerce.number().default(0),
  isActive: z.boolean().default(false),
});

export const bannerFormDefaults = {
  title: '',
  subtitle: '',
  description: '',
  ctaLabel: '',
  primaryMedia: null,
  linkUrl: '',
  altText: '',
  position: 'homepage_hero',
  order: 0,
  isActive: false,
};
