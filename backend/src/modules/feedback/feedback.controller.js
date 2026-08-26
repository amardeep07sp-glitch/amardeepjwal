import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { feedbackService } from './feedback.service.js';
import { serializeFeedbackList } from './feedback.serializer.js';

export const listFeedback = asyncHandler(async (req, res) => {
  const { items, meta } = await feedbackService.listFeedback(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeFeedbackList(items), meta }, 'Feedback fetched successfully'));
});

export const getFeedbackSummary = asyncHandler(async (req, res) => {
  const summary = await feedbackService.getSummary();
  res.status(200).json(new ApiResponse(200, summary, 'Feedback summary fetched successfully'));
});
