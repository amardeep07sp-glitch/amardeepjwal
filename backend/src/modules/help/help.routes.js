import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import {
  createHelpArticleSchema,
  updateHelpArticleSchema,
  helpArticleIdSchema,
  listHelpArticlesAdminQuerySchema,
  listPublicArticlesQuerySchema,
  articleSlugSchema,
  voteHelpfulSchema,
  featuredArticlesQuerySchema,
  updateHelpCategorySchema,
} from './help.validation.js';
import {
  listArticlesAdmin,
  getArticleByIdAdmin,
  createArticle,
  updateArticle,
  deleteArticle,
  listCategories,
  listPublishedArticles,
  getFeaturedArticles,
  searchArticles,
  getPublishedArticleBySlug,
  voteHelpful,
  getSearchAnalytics,
  listCategoriesAdmin,
  updateCategory,
} from './help.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Support/help content management reuses STAFF - no new "content manager"
// role for this pass (per the RBAC scoping decision: reuse existing roles).
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

// ---- Public Help Center - no auth required, this is the customer-facing
// content browse/search surface (Phase 3). ----
router.get('/categories', listCategories);
router.get('/search', validate(listPublicArticlesQuerySchema), searchArticles);
router.get('/articles/featured', validate(featuredArticlesQuerySchema), getFeaturedArticles);
router.get('/articles', validate(listPublicArticlesQuerySchema), listPublishedArticles);
router.get('/articles/:slug', validate(articleSlugSchema), getPublishedArticleBySlug);
router.post('/articles/:slug/helpful', validate(voteHelpfulSchema), voteHelpful);

// ---- Admin CMS (Phase 4) ----
router.get('/admin/articles', protect, canView, validate(listHelpArticlesAdminQuerySchema), listArticlesAdmin);
router.get('/admin/articles/:id', protect, canView, validate(helpArticleIdSchema), getArticleByIdAdmin);
router.post('/admin/articles', protect, canManage, validate(createHelpArticleSchema), createArticle);
router.put('/admin/articles/:id', protect, canManage, validate(updateHelpArticleSchema), updateArticle);
router.delete('/admin/articles/:id', protect, canManage, validate(helpArticleIdSchema), deleteArticle);

router.get('/admin/search-analytics', protect, canView, getSearchAnalytics);

router.get('/admin/categories', protect, canView, listCategoriesAdmin);
router.put('/admin/categories/:code', protect, canManage, validate(updateHelpCategorySchema), updateCategory);

export default router;
