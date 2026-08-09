import { z } from 'zod';

const footerLinkBody = z.object({
  label: z.string().min(1, 'Link label is required'),
  url: z.string().min(1, 'Link URL is required'),
  order: z.number().optional(),
});

const footerColumnBody = z.object({
  title: z.string().min(1, 'Column title is required'),
  order: z.number().optional(),
  isActive: z.boolean().optional(),
  links: z.array(footerLinkBody).optional(),
});

export const createFooterColumnSchema = z.object({ body: footerColumnBody });

export const updateFooterColumnSchema = z.object({
  params: z.object({ id: z.string() }),
  body: footerColumnBody.partial(),
});

export const footerColumnIdSchema = z.object({ params: z.object({ id: z.string() }) });
