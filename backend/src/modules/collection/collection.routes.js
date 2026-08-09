import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createCollectionSchema,
  updateCollectionSchema,
  collectionIdSchema,
  listCollectionsQuerySchema,
  bulkIdsSchema,
  bulkStatusSchema,
  previewRuleMatchesSchema,
  collectionProductsQuerySchema,
  reorderCollectionProductsSchema,
  publicCollectionListQuerySchema,
  publicCollectionSlugSchema,
  publicCollectionProductsQuerySchema,
} from './collection.validation.js';
import {
  listCollections,
  getCollectionById,
  createCollection,
  updateCollection,
  deleteCollection,
  bulkDeleteCollections,
  bulkUpdateCollectionStatus,
  duplicateCollection,
  previewRuleMatches,
  getCollectionProducts,
  reorderCollectionProducts,
  getCollectionDashboardStats,
  listPublicCollections,
  getPublicCollectionBySlug,
  getPublicCollectionProducts,
  trackPublicCollectionClick,
} from './collection.controller.js';

const router = Router();
const manageCatalog = authorize(...PRIVILEGED_ROLES);

// --- Public storefront (unauthenticated) - mounted first, same
// /public/*-before-/:id precedent as Category/Product/Banner, so a slug
// like "public" never collides with the admin :id route below. -----------
router.get('/public', validate(publicCollectionListQuerySchema), listPublicCollections);
router.get('/public/:slug', validate(publicCollectionSlugSchema), getPublicCollectionBySlug);
router.get('/public/:slug/products', validate(publicCollectionProductsQuerySchema), getPublicCollectionProducts);
router.post('/public/:id/click', validate(collectionIdSchema), trackPublicCollectionClick);

// --- Admin ------------------------------------------------------------------
router.get('/dashboard-stats', protect, getCollectionDashboardStats);
router.post('/preview-rules', protect, manageCatalog, validate(previewRuleMatchesSchema), previewRuleMatches);

router.get('/', protect, validate(listCollectionsQuerySchema), listCollections);
router.post('/', protect, manageCatalog, validate(createCollectionSchema), createCollection);
router.post('/bulk-delete', protect, manageCatalog, validate(bulkIdsSchema), bulkDeleteCollections);
router.patch('/bulk-status', protect, manageCatalog, validate(bulkStatusSchema), bulkUpdateCollectionStatus);

router.get('/:id', protect, validate(collectionIdSchema), getCollectionById);
router.put('/:id', protect, manageCatalog, validate(updateCollectionSchema), updateCollection);
router.post('/:id/duplicate', protect, manageCatalog, validate(collectionIdSchema), duplicateCollection);
router.delete('/:id', protect, manageCatalog, validate(collectionIdSchema), deleteCollection);

router.get('/:id/products', protect, validate(collectionProductsQuerySchema), getCollectionProducts);
router.patch('/:id/products/reorder', protect, manageCatalog, validate(reorderCollectionProductsSchema), reorderCollectionProducts);

export default router;
