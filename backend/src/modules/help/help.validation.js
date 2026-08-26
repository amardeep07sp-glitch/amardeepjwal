import { z } from 'zod';
import { HELP_ARTICLE_STATUS_VALUES, HELP_CATEGORY_VALUES } from './help.constants.js';

const objectId = z.string().min(1);

const helpArticleBody = z.object({
  title: z.string().trim().min(1, 'Title is required'),
  slug: z.string().trim().optional(),
  category: z.enum(HELP_CATEGORY_VALUES),
  content: z.string().optional(),
  summary: z.string().trim().optional(),
  tags: z.array(z.string()).optional(),
  relatedProducts: z.array(objectId).optional(),
  status: z.enum(HELP_ARTICLE_STATUS_VALUES).optional(),
  featured: z.boolean().optional(),
  displayOrder: z.coerce.number().optional(),
  seoTitle: z.string().trim().optional(),
  seoDescription: z.string().trim().optional(),
});

export const createHelpArticleSchema = z.object({ body: helpArticleBody });

export const updateHelpArticleSchema = z.object({
  params: z.object({ id: z.string() }),
  body: helpArticleBody.partial(),
});

export const helpArticleIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listHelpArticlesAdminQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().optional(),
    category: z.enum(HELP_CATEGORY_VALUES).optional(),
    status: z.enum(HELP_ARTICLE_STATUS_VALUES).optional(),
    featured: z.coerce.boolean().optional(),
  }),
});

export const listPublicArticlesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(50).default(20),
    category: z.enum(HELP_CATEGORY_VALUES).optional(),
    tag: z.string().trim().optional(),
    search: z.string().trim().optional(),
  }),
});

export const articleSlugSchema = z.object({ params: z.object({ slug: z.string().min(1) }) });

export const voteHelpfulSchema = z.object({
  params: z.object({ slug: z.string().min(1) }),
  body: z.object({ helpful: z.boolean() }),
});

export const featuredArticlesQuerySchema = z.object({
  query: z.object({ limit: z.coerce.number().int().positive().max(20).default(6) }),
});

export const updateHelpCategorySchema = z.object({
  params: z.object({ code: z.enum(HELP_CATEGORY_VALUES) }),
  body: z.object({
    label: z.string().trim().min(1).optional(),
    description: z.string().trim().optional(),
    icon: z.string().trim().optional(),
    displayOrder: z.coerce.number().optional(),
    active: z.boolean().optional(),
  }),
});
