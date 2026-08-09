import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { createCsvUploadMiddleware } from '../../middlewares/csvUpload.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createCategorySchema,
  updateCategorySchema,
  categoryIdSchema,
  listCategoriesQuerySchema,
  categoryTreeQuerySchema,
  updateStatusSchema,
  reorderCategoriesSchema,
  bulkIdsSchema,
  bulkStatusSchema,
  trashQuerySchema,
  autocompleteQuerySchema,
  mergeCategorySchema,
  analyticsQuerySchema,
  publicSlugSchema,
  publicCategoryListQuerySchema,
  publicCategoryPaginatedQuerySchema,
} from './category.validation.js';
import {
  listCategories,
  getCategoryTree,
  getCategoryById,
  getCategoryBreadcrumb,
  listTrashedCategories,
  autocompleteCategories,
  getCategorySitemap,
  exportCategories,
  importCategories,
  createCategory,
  updateCategory,
  updateCategoryStatus,
  reorderCategories,
  deleteCategory,
  restoreCategory,
  permanentlyDeleteCategory,
  bulkDeleteCategories,
  bulkUpdateCategoryStatus,
  duplicateCategory,
  mergeCategory,
  getCategoryAnalytics,
  getPublicCategoryTree,
  getPublicCategoryBySlug,
  trackPublicCategoryClick,
  getPublicFeaturedCategories,
  getPublicHomepageCategories,
  getPublicNavbarCategories,
  getPublicTrendingCategories,
  listPublicCategories,
} from './category.controller.js';

const router = Router();
const manageCatalog = authorize(...PRIVILEGED_ROLES);
const handleCategoryCsvUpload = createCsvUploadMiddleware('file');

// --- Public storefront routes - deliberately unauthenticated, and mounted
// under "/public" so they can never collide with an admin "/:id" route. ---
router.get('/public', validate(publicCategoryPaginatedQuerySchema), listPublicCategories);
router.get('/public/tree', getPublicCategoryTree);
router.get('/public/featured', validate(publicCategoryListQuerySchema), getPublicFeaturedCategories);
router.get('/public/homepage', validate(publicCategoryListQuerySchema), getPublicHomepageCategories);
router.get('/public/navbar', getPublicNavbarCategories);
router.get('/public/trending', validate(publicCategoryListQuerySchema), getPublicTrendingCategories);
router.get('/public/:slug', validate(publicSlugSchema), getPublicCategoryBySlug);
router.post('/public/:id/click', validate(categoryIdSchema), trackPublicCategoryClick);

// Crawler-facing, so deliberately unauthenticated - must stay above "/:id".
router.get('/sitemap.xml', getCategorySitemap);

// Specific routes must come before "/:id" so Express doesn't treat them as an id.
router.get('/tree', protect, validate(categoryTreeQuerySchema), getCategoryTree);
router.get('/trash', protect, manageCatalog, validate(trashQuerySchema), listTrashedCategories);
router.get('/autocomplete', protect, validate(autocompleteQuerySchema), autocompleteCategories);
router.get('/analytics', protect, manageCatalog, validate(analyticsQuerySchema), getCategoryAnalytics);
router.get('/export', protect, manageCatalog, exportCategories);
router.get('/', protect, validate(listCategoriesQuerySchema), listCategories);

router.post('/', protect, manageCatalog, validate(createCategorySchema), createCategory);
router.post('/import', protect, manageCatalog, handleCategoryCsvUpload, importCategories);
router.patch('/reorder', protect, manageCatalog, validate(reorderCategoriesSchema), reorderCategories);
router.post('/bulk-delete', protect, manageCatalog, validate(bulkIdsSchema), bulkDeleteCategories);
router.patch('/bulk-status', protect, manageCatalog, validate(bulkStatusSchema), bulkUpdateCategoryStatus);

router.get('/:id', protect, validate(categoryIdSchema), getCategoryById);
router.get('/:id/breadcrumb', protect, validate(categoryIdSchema), getCategoryBreadcrumb);
router.put('/:id', protect, manageCatalog, validate(updateCategorySchema), updateCategory);
router.patch('/:id/status', protect, manageCatalog, validate(updateStatusSchema), updateCategoryStatus);
router.post('/:id/duplicate', protect, manageCatalog, validate(categoryIdSchema), duplicateCategory);
router.post('/:id/merge', protect, manageCatalog, validate(mergeCategorySchema), mergeCategory);
router.post('/:id/restore', protect, manageCatalog, validate(categoryIdSchema), restoreCategory);
router.delete('/:id/permanent', protect, manageCatalog, validate(categoryIdSchema), permanentlyDeleteCategory);
router.delete('/:id', protect, manageCatalog, validate(categoryIdSchema), deleteCategory);

export default router;
