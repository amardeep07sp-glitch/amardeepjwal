import { z } from 'zod';

// Must match backend/src/modules/help/help.constants.js#HELP_CATEGORIES
// exactly (a fixed list, not an admin-CRUD collection - see that file's own
// header comment for why).
export const HELP_CATEGORIES = [
  { value: 'orders', label: 'Orders' },
  { value: 'payments', label: 'Payments' },
  { value: 'shipping', label: 'Shipping' },
  { value: 'returns_refunds', label: 'Returns & Refunds' },
  { value: 'coupons_offers', label: 'Coupons & Offers' },
  { value: 'jewellery_pricing', label: 'Jewellery & Pricing' },
  { value: 'account', label: 'Account' },
  { value: 'invoice', label: 'Invoice' },
  { value: 'wishlist', label: 'Wishlist' },
  { value: 'reviews', label: 'Reviews' },
  { value: 'website', label: 'Website' },
  { value: 'security', label: 'Security' },
];

export const HELP_ARTICLE_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'published', label: 'Published' },
  { value: 'archived', label: 'Archived' },
];

export const HELP_STATUS_BADGE_VARIANTS = { draft: 'secondary', published: 'success', archived: 'secondary' };

export const helpArticleSchema = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  slug: z.string().trim().optional(),
  category: z.enum(HELP_CATEGORIES.map((c) => c.value)),
  content: z.string().optional(),
  summary: z.string().trim().optional(),
  tags: z.array(z.string()).optional(),
  status: z.enum(HELP_ARTICLE_STATUSES.map((s) => s.value)).default('draft'),
  featured: z.boolean().default(false),
  displayOrder: z.coerce.number().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
});

export const helpArticleFormDefaults = {
  title: '',
  slug: '',
  category: 'orders',
  content: '',
  summary: '',
  tags: [],
  status: 'draft',
  featured: false,
  displayOrder: 0,
  seoTitle: '',
  seoDescription: '',
};
