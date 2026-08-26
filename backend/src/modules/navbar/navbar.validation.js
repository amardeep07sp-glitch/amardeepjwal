import { z } from 'zod';
import { NAVBAR_ITEM_TYPES } from '../../constants/cms.js';

// `page`/`parent` are ObjectId refs on the model - the admin form sends ''
// (not omitted, not null) for a Custom URL item with no page selected,
// which Mongoose then tries to CastError on. Empty string -> null here so
// it never reaches the model as an invalid ObjectId.
const emptyToNull = z
  .string()
  .optional()
  .nullable()
  .transform((v) => (v ? v : null));

const navbarItemBody = z.object({
  label: z.string().min(1, 'Label is required'),
  type: z.enum(Object.values(NAVBAR_ITEM_TYPES)).default(NAVBAR_ITEM_TYPES.CUSTOM_LINK),
  url: z.string().optional(),
  page: emptyToNull,
  parent: emptyToNull,
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
