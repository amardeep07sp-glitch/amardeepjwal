import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { visitorAnalyticsService } from './visitorAnalytics.service.js';
import { deviceAnalyticsService } from './deviceAnalytics.service.js';
import { locationAnalyticsService } from './locationAnalytics.service.js';
import { trafficAnalyticsService } from './trafficAnalytics.service.js';
import { searchAnalyticsService } from './searchAnalytics.service.js';
import { productAnalyticsService } from './productAnalytics.service.js';
import { categoryAnalyticsService } from './categoryAnalytics.service.js';
import { collectionAnalyticsService } from './collectionAnalytics.service.js';
import { funnelAnalyticsService } from './funnelAnalytics.service.js';
import { journeyAnalyticsService } from './journeyAnalytics.service.js';
import { cartAnalyticsService } from './cartAnalytics.service.js';
import { wishlistAnalyticsService } from './wishlistAnalytics.service.js';
import { marketingAnalyticsService } from './marketingAnalytics.service.js';
import { notificationAnalyticsService } from './notificationAnalytics.service.js';
import { loginLocationService } from './loginLocation.service.js';

// Every named CIP report (Visitor/Device/Location/Session/Search/Product/
// Category/Funnel/Journey/Cart/Wishlist/Marketing/Notification), each a
// thin asyncHandler over its own analytics service - grouped into one
// controller file because splitting a dozen 3-line wrappers into a dozen
// files would hurt readability more than it would help it (the same
// consolidation judgment Phase 11's DomainReportsTab made on the frontend).

export const getVisitorReport = asyncHandler(async (req, res) => {
  const report = await visitorAnalyticsService.getVisitorReport(req.query);
  res.status(200).json(new ApiResponse(200, report, 'Visitor report fetched successfully'));
});

export const getEngagementSummary = asyncHandler(async (req, res) => {
  const summary = await visitorAnalyticsService.getEngagementSummary(req.query);
  res.status(200).json(new ApiResponse(200, summary, 'Engagement summary fetched successfully'));
});

export const getDeviceReport = asyncHandler(async (req, res) => {
  const report = await deviceAnalyticsService.getDeviceReport(req.query);
  res.status(200).json(new ApiResponse(200, report, 'Device report fetched successfully'));
});

export const getLocationReport = asyncHandler(async (req, res) => {
  const report = await locationAnalyticsService.getLocationReport(req.query);
  res.status(200).json(new ApiResponse(200, report, 'Location report fetched successfully'));
});

export const getLoginLocationPoints = asyncHandler(async (req, res) => {
  const points = await loginLocationService.getRecentPoints();
  res.status(200).json(new ApiResponse(200, points, 'Login locations fetched successfully'));
});

export const getLoginLocationStates = asyncHandler(async (req, res) => {
  const rows = await loginLocationService.getStateBreakdown();
  res.status(200).json(new ApiResponse(200, rows, 'Login location state breakdown fetched successfully'));
});

export const getOrderLocationStates = asyncHandler(async (req, res) => {
  const rows = await locationAnalyticsService.getOrderStateBreakdown(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Order location state breakdown fetched successfully'));
});

export const getSourceBreakdown = asyncHandler(async (req, res) => {
  const rows = await trafficAnalyticsService.getSourceBreakdown(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Traffic source report fetched successfully'));
});

export const getUtmCampaignReport = asyncHandler(async (req, res) => {
  const rows = await trafficAnalyticsService.getUtmCampaignReport(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'UTM campaign report fetched successfully'));
});

export const getTopLandingPages = asyncHandler(async (req, res) => {
  const rows = await trafficAnalyticsService.getTopLandingPages(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Top landing pages fetched successfully'));
});

export const getTopSearches = asyncHandler(async (req, res) => {
  const rows = await searchAnalyticsService.getTopSearches(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Top searches fetched successfully'));
});

export const getNoResultSearches = asyncHandler(async (req, res) => {
  const rows = await searchAnalyticsService.getNoResultSearches(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'No-result searches fetched successfully'));
});

export const getTrendingSearches = asyncHandler(async (req, res) => {
  const rows = await searchAnalyticsService.getTrendingSearches(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Trending searches fetched successfully'));
});

export const getSearchConversion = asyncHandler(async (req, res) => {
  const result = await searchAnalyticsService.getSearchConversion(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Search conversion fetched successfully'));
});

export const getProductPerformance = asyncHandler(async (req, res) => {
  const result = await productAnalyticsService.getProductPerformance(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Product performance fetched successfully'));
});

export const getCategoryPerformance = asyncHandler(async (req, res) => {
  const rows = await categoryAnalyticsService.getCategoryPerformance(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Category performance fetched successfully'));
});

export const getCollectionPerformance = asyncHandler(async (req, res) => {
  const rows = await collectionAnalyticsService.getCollectionPerformance(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Collection performance fetched successfully'));
});

export const getFunnel = asyncHandler(async (req, res) => {
  const rows = await funnelAnalyticsService.getFunnel(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Funnel fetched successfully'));
});

export const getSessionJourney = asyncHandler(async (req, res) => {
  const events = await journeyAnalyticsService.getSessionJourney(req.params.sessionId);
  res.status(200).json(new ApiResponse(200, events, 'Session journey fetched successfully'));
});

export const getCommonPaths = asyncHandler(async (req, res) => {
  const rows = await journeyAnalyticsService.getCommonPaths(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Common journey paths fetched successfully'));
});

export const getCartSummary = asyncHandler(async (req, res) => {
  const result = await cartAnalyticsService.getCartSummary(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Cart summary fetched successfully'));
});

export const getCartRecovery = asyncHandler(async (req, res) => {
  const result = await cartAnalyticsService.getRecoveryRate(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Cart recovery rate fetched successfully'));
});

export const getMostWishlisted = asyncHandler(async (req, res) => {
  const rows = await wishlistAnalyticsService.getMostWishlisted(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Most wishlisted products fetched successfully'));
});

export const getWishlistConversion = asyncHandler(async (req, res) => {
  const result = await wishlistAnalyticsService.getWishlistConversion(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Wishlist conversion fetched successfully'));
});

export const getCampaignPerformance = asyncHandler(async (req, res) => {
  const rows = await marketingAnalyticsService.getCampaignPerformance(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Campaign performance fetched successfully'));
});

export const getNotificationReport = asyncHandler(async (req, res) => {
  const report = await notificationAnalyticsService.getNotificationReport(req.query);
  res.status(200).json(new ApiResponse(200, report, 'Notification report fetched successfully'));
});
