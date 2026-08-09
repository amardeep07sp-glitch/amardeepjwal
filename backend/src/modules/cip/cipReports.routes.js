import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import {
  dateRangeQuerySchema,
  dateRangeWithLimitQuerySchema,
  productPerformanceQuerySchema,
  trendingSearchesQuerySchema,
  commonPathsQuerySchema,
  sessionIdParamSchema,
} from './cipReports.validation.js';
import {
  getVisitorReport,
  getDeviceReport,
  getLocationReport,
  getSourceBreakdown,
  getUtmCampaignReport,
  getTopLandingPages,
  getTopSearches,
  getNoResultSearches,
  getTrendingSearches,
  getSearchConversion,
  getProductPerformance,
  getCategoryPerformance,
  getCollectionPerformance,
  getFunnel,
  getSessionJourney,
  getCommonPaths,
  getCartSummary,
  getCartRecovery,
  getMostWishlisted,
  getWishlistConversion,
  getCampaignPerformance,
  getNotificationReport,
} from './cipReports.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/visitors', protect, canView, validate(dateRangeQuerySchema), getVisitorReport);
router.get('/devices', protect, canView, validate(dateRangeQuerySchema), getDeviceReport);
router.get('/locations', protect, canView, validate(dateRangeQuerySchema), getLocationReport);

router.get('/traffic/sources', protect, canView, validate(dateRangeQuerySchema), getSourceBreakdown);
router.get('/traffic/utm-campaigns', protect, canView, validate(dateRangeQuerySchema), getUtmCampaignReport);
router.get('/traffic/landing-pages', protect, canView, validate(dateRangeWithLimitQuerySchema), getTopLandingPages);

router.get('/search/top', protect, canView, validate(dateRangeWithLimitQuerySchema), getTopSearches);
router.get('/search/no-results', protect, canView, validate(dateRangeWithLimitQuerySchema), getNoResultSearches);
router.get('/search/trending', protect, canView, validate(trendingSearchesQuerySchema), getTrendingSearches);
router.get('/search/conversion', protect, canView, validate(dateRangeQuerySchema), getSearchConversion);

router.get('/products/performance', protect, canView, validate(productPerformanceQuerySchema), getProductPerformance);
router.get('/categories/performance', protect, canView, validate(dateRangeWithLimitQuerySchema), getCategoryPerformance);
router.get('/collections/performance', protect, canView, validate(dateRangeWithLimitQuerySchema), getCollectionPerformance);

router.get('/funnel', protect, canView, validate(dateRangeQuerySchema), getFunnel);

router.get('/journey/session/:sessionId', protect, canView, validate(sessionIdParamSchema), getSessionJourney);
router.get('/journey/common-paths', protect, canView, validate(commonPathsQuerySchema), getCommonPaths);

router.get('/cart/summary', protect, canView, validate(dateRangeQuerySchema), getCartSummary);
router.get('/cart/recovery', protect, canView, validate(dateRangeQuerySchema), getCartRecovery);

router.get('/wishlist/top', protect, canView, validate(dateRangeWithLimitQuerySchema), getMostWishlisted);
router.get('/wishlist/conversion', protect, canView, validate(dateRangeQuerySchema), getWishlistConversion);

router.get('/marketing/campaigns', protect, canView, validate(dateRangeQuerySchema), getCampaignPerformance);

router.get('/notifications', protect, canView, validate(dateRangeQuerySchema), getNotificationReport);

export default router;
