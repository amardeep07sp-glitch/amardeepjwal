import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createBrandSchema,
  updateBrandSchema,
  brandIdSchema,
  listBrandsQuerySchema,
  bulkIdsSchema,
  bulkStatusSchema,
  publicBrandSlugSchema,
  publicBrandPaginatedQuerySchema,
  publicFeaturedBrandsQuerySchema,
} from './brand.validation.js';
import {
  listBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
  bulkDeleteBrands,
  bulkUpdateBrandStatus,
  listPublicBrands,
  getPublicFeaturedBrands,
  getPublicBrandBySlug,
} from './brand.controller.js';

const router = Router();
const manageCatalog = authorize(...PRIVILEGED_ROLES);

// --- Public storefront routes - deliberately unauthenticated, and mounted
// under "/public" so they can never collide with an admin "/:id" route
// (same convention as category.routes.js). ---
router.get('/public', validate(publicBrandPaginatedQuerySchema), listPublicBrands);
router.get('/public/featured', validate(publicFeaturedBrandsQuerySchema), getPublicFeaturedBrands);
router.get('/public/:slug', validate(publicBrandSlugSchema), getPublicBrandBySlug);

router.get('/', protect, validate(listBrandsQuerySchema), listBrands);
router.post('/', protect, manageCatalog, validate(createBrandSchema), createBrand);
router.post('/bulk-delete', protect, manageCatalog, validate(bulkIdsSchema), bulkDeleteBrands);
router.patch('/bulk-status', protect, manageCatalog, validate(bulkStatusSchema), bulkUpdateBrandStatus);

router.get('/:id', protect, validate(brandIdSchema), getBrandById);
router.put('/:id', protect, manageCatalog, validate(updateBrandSchema), updateBrand);
router.delete('/:id', protect, manageCatalog, validate(brandIdSchema), deleteBrand);

export default router;
