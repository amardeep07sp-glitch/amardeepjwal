import { z } from 'zod';
import { NAVBAR_ITEM_TYPES } from '../../constants/cms.js';

const navbarItemBody = z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.enum(Object.values(NAVBAR_ITEM_TYPES)).default(NAVBAR_ITEM_TYPES.CUSTOM_LINK),
  url: z.string().optional(),
  page: z.string().optional().nullable(),
  parent: z.string().optional().nullable(),
  order: z.number().optional(),
  openInNewTab: z.boolean().optional(),
  isActive: z.boolean().optional(),
});

export const createNavbarItemSchema = z.object({ body: navbarItemBody });

export const updateNavbarItemSchema = z.object({
  params: z.object({ id: z.string() }),
  body: navbarItemBody.partial(),
});

export const navbarItemIdSchema = z.object({ params: z.object({ id: z.string() }) });
