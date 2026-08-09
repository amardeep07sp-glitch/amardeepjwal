import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { executiveDashboardService } from './executiveDashboard.service.js';

export const getDashboardCards = asyncHandler(async (req, res) => {
  const cards = await executiveDashboardService.getDashboardCards();
  res.status(200).json(new ApiResponse(200, cards, 'Executive dashboard cards fetched successfully'));
});

export const getDashboardCharts = asyncHandler(async (req, res) => {
  const charts = await executiveDashboardService.getDashboardCharts({ days: Number(req.query.days) || 14 });
  res.status(200).json(new ApiResponse(200, charts, 'Executive dashboard charts fetched successfully'));
});
