import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { reviewService } from './review.service.js';
import {
  serializeReview,
  serializeReviewList,
  serializeReportedReviewList,
  serializeReviewReportList,
  serializePublicFeaturedReviewList,
} from './review.serializer.js';

export const getFeaturedReviews = asyncHandler(async (req, res) => {
  const reviews = await reviewService.listFeatured(req.query.limit);
  res.status(200).json(new ApiResponse(200, serializePublicFeaturedReviewList(reviews), 'Featured reviews fetched successfully'));
});

export const listReviews = asyncHandler(async (req, res) => {
  const { items, meta } = await reviewService.listReviews(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeReviewList(items), meta }, 'Reviews fetched successfully'));
});

export const moderateReview = asyncHandler(async (req, res) => {
  const review = await reviewService.moderateReview(req.params.id, req.body.status, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeReview(review), 'Review updated successfully'));
});

export const deleteReview = asyncHandler(async (req, res) => {
  await reviewService.deleteReview(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Review deleted successfully'));
});

export const listReportedReviews = asyncHandler(async (req, res) => {
  const { items, meta } = await reviewService.listReportedReviews(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeReportedReviewList(items), meta }, 'Reported reviews fetched successfully'));
});

export const getReportsForReview = asyncHandler(async (req, res) => {
  const reports = await reviewService.listReportsForReview(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeReviewReportList(reports), 'Reports fetched successfully'));
});

export const dismissReport = asyncHandler(async (req, res) => {
  await reviewService.dismissReport(req.params.reportId, req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Report dismissed successfully'));
});
