import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { financialDashboardService } from './financialDashboard.service.js';

export const getDashboardTotals = asyncHandler(async (req, res) => {
  const totals = await financialDashboardService.getDashboardTotals();
  res.status(200).json(new ApiResponse(200, totals, 'Dashboard totals fetched successfully'));
});

export const getIncomeVsExpenseTrend = asyncHandler(async (req, res) => {
  const trend = await financialDashboardService.getIncomeVsExpenseTrend(Number(req.query.months) || 6);
  res.status(200).json(new ApiResponse(200, trend, 'Income vs expense trend fetched successfully'));
});

export const getCashFlowTrend = asyncHandler(async (req, res) => {
  const trend = await financialDashboardService.getCashFlowTrend(Number(req.query.days) || 14);
  res.status(200).json(new ApiResponse(200, trend, 'Cash flow trend fetched successfully'));
});

export const getProfitTrend = asyncHandler(async (req, res) => {
  const trend = await financialDashboardService.getProfitTrend(Number(req.query.days) || 14);
  res.status(200).json(new ApiResponse(200, trend, 'Profit trend fetched successfully'));
});
