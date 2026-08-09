import { z } from 'zod';
import { mediaRefSchema } from '../../media/mediaSchema';

export const homepageSectionSchema = z
  .object({
    internalTitle: z.string().min(1, 'Internal title is required'),
    type: z.enum(['banner', 'text_block']),
    banner: z.string().optional(),
    heading: z.string().optional(),
    body: z.string().optional(),
    primaryMedia: mediaRefSchema,
    order: z.coerce.number().default(0),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.type !== 'banner' || data.banner, {
    message: 'Select a banner',
    path: ['banner'],
  })
  .refine((data) => data.type !== 'text_block' || data.heading, {
    message: 'Heading is required for a text block',
    path: ['heading'],
  });

export const homepageSectionFormDefaults = {
  internalTitle: '',
  type: 'banner',
  banner: '',
  heading: '',
  body: '',
  primaryMedia: null,
  order: 0,
  isActive: true,
};
