import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { executiveCipDashboardService } from './executiveCipDashboard.service.js';

export const getDashboardCards = asyncHandler(async (req, res) => {
  const cards = await executiveCipDashboardService.getDashboardCards();
  res.status(200).json(new ApiResponse(200, cards, 'CIP dashboard cards fetched successfully'));
});

export const getDashboardWidgets = asyncHandler(async (req, res) => {
  const widgets = await executiveCipDashboardService.getDashboardWidgets({ days: Number(req.query.days) || 14 });
  res.status(200).json(new ApiResponse(200, widgets, 'CIP dashboard widgets fetched successfully'));
});
