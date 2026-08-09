import { z } from 'zod';

export const navbarItemSchema = z
  .object({
    label: z.string().min(1, 'Label is required'),
    type: z.enum(['custom_link', 'static_page']).default('custom_link'),
    url: z.string().optional(),
    page: z.string().optional(),
    order: z.coerce.number().default(0),
    openInNewTab: z.boolean().default(false),
    isActive: z.boolean().default(true),
  })
  .refine((data) => data.type !== 'custom_link' || data.url, {
    message: 'URL is required for a custom link',
    path: ['url'],
  })
  .refine((data) => data.type !== 'static_page' || data.page, {
    message: 'Select a page',
    path: ['page'],
  });

export const navbarItemFormDefaults = {
  label: '',
  type: 'custom_link',
  url: '',
  page: '',
  order: 0,
  openInNewTab: false,
  isActive: true,
};
