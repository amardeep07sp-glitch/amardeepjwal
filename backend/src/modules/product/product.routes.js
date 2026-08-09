import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import {
  createProductSchema,
  updateProductSchema,
  productIdSchema,
  listProductsQuerySchema,
  bulkIdsSchema,
  bulkStatusSchema,
  nextSkuQuerySchema,
  overrideSkuSchema,
  publicProductListQuerySchema,
  publicProductPaginatedQuerySchema,
  publicProductSlugSchema,
  publicProductSimilarQuerySchema,
  publicSearchSuggestQuerySchema,
} from './product.validation.js';
import {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  bulkDeleteProducts,
  bulkUpdateProductStatus,
  duplicateProduct,
  previewNextSku,
  overrideSku,
  listPublicProducts,
  getPublicFacets,
  getPublicSearchSuggestions,
  getPublicNewArrivals,
  getPublicFeaturedProducts,
  getPublicTrendingProducts,
  getPublicProductBySlug,
  getPublicSimilarProducts,
} from './product.controller.js';
import { updatePricingSchema, pricingHistoryQuerySchema } from './pricing/pricing.validation.js';
import { getPricing, updatePricing, getPriceHistory } from './pricing/pricing.controller.js';
import {
  createVariantSchema,
  updateVariantSchema,
  variantIdSchema,
  listVariantsQuerySchema,
  generateVariantsSchema,
  bulkVariantIdsSchema,
  bulkVariantStatusSchema,
} from './variant/variant.validation.js';
import {
  listVariants,
  getVariantById,
  createVariant,
  updateVariant,
  deleteVariant,
  bulkDeleteVariants,
  bulkUpdateVariantStatus,
  bulkDuplicateVariants,
  generateVariants,
} from './variant/variant.controller.js';

const router = Router();
const manageCatalog = authorize(...PRIVILEGED_ROLES);

// --- Public storefront routes - deliberately unauthenticated, and mounted
// under "/public" so they can never collide with an admin "/:id" route. ---
router.get('/public', validate(publicProductPaginatedQuerySchema), listPublicProducts);
router.get('/public/facets', getPublicFacets);
router.get('/public/search-suggestions', validate(publicSearchSuggestQuerySchema), getPublicSearchSuggestions);
router.get('/public/new-arrivals', validate(publicProductListQuerySchema), getPublicNewArrivals);
router.get('/public/featured', validate(publicProductListQuerySchema), getPublicFeaturedProducts);
router.get('/public/trending', validate(publicProductListQuerySchema), getPublicTrendingProducts);
router.get('/public/:slug/similar', validate(publicProductSimilarQuerySchema), getPublicSimilarProducts);
router.get('/public/:slug', validate(publicProductSlugSchema), getPublicProductBySlug);

router.get('/', protect, validate(listProductsQuerySchema), listProducts);
router.get('/next-sku', protect, manageCatalog, validate(nextSkuQuerySchema), previewNextSku);
router.post('/', protect, manageCatalog, validate(createProductSchema), createProduct);
router.post('/bulk-delete', protect, manageCatalog, validate(bulkIdsSchema), bulkDeleteProducts);
router.patch('/bulk-status', protect, manageCatalog, validate(bulkStatusSchema), bulkUpdateProductStatus);

router.get('/:id', protect, validate(productIdSchema), getProductById);
router.put('/:id', protect, manageCatalog, validate(updateProductSchema), updateProduct);
router.patch('/:id/sku', protect, authorize(ROLES.SUPER_ADMIN), validate(overrideSkuSchema), overrideSku);
router.post('/:id/duplicate', protect, manageCatalog, validate(productIdSchema), duplicateProduct);
router.delete('/:id', protect, manageCatalog, validate(productIdSchema), deleteProduct);

router.get('/:id/pricing', protect, validate(productIdSchema), getPricing);
router.put('/:id/pricing', protect, manageCatalog, validate(updatePricingSchema), updatePricing);
router.get('/:id/pricing/history', protect, validate(pricingHistoryQuerySchema), getPriceHistory);

router.get('/:id/variants', protect, validate(listVariantsQuerySchema), listVariants);
router.post('/:id/variants', protect, manageCatalog, validate(createVariantSchema), createVariant);
router.post('/:id/variants/generate', protect, manageCatalog, validate(generateVariantsSchema), generateVariants);
router.post('/:id/variants/bulk-delete', protect, manageCatalog, validate(bulkVariantIdsSchema), bulkDeleteVariants);
router.post(
  '/:id/variants/bulk-duplicate',
  protect,
  manageCatalog,
  validate(bulkVariantIdsSchema),
  bulkDuplicateVariants
);
router.patch(
  '/:id/variants/bulk-status',
  protect,
  manageCatalog,
  validate(bulkVariantStatusSchema),
  bulkUpdateVariantStatus
);
router.get('/:id/variants/:variantId', protect, validate(variantIdSchema), getVariantById);
router.put('/:id/variants/:variantId', protect, manageCatalog, validate(updateVariantSchema), updateVariant);
router.delete('/:id/variants/:variantId', protect, manageCatalog, validate(variantIdSchema), deleteVariant);

export default router;
