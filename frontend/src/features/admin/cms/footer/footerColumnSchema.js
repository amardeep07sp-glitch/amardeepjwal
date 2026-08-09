import { z } from 'zod';

export const footerLinkSchema = z.object({
  label: z.string().min(1, 'Link label is required'),
  url: z.string().min(1, 'Link URL is required'),
});

export const footerColumnSchema = z.object({
  title: z.string().min(1, 'Column title is required'),
  order: z.coerce.number().default(0),
  isActive: z.boolean().default(true),
  links: z.array(footerLinkSchema).default([]),
});

export const footerColumnFormDefaults = {
  title: '',
  order: 0,
  isActive: true,
  links: [],
};
