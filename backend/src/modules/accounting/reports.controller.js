import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { reportsService } from './reports.service.js';

export const getProfitAndLoss = asyncHandler(async (req, res) => {
  const report = await reportsService.getProfitAndLoss(req.query);
  res.status(200).json(new ApiResponse(200, report, 'Profit & Loss fetched successfully'));
});

export const getBalanceSheet = asyncHandler(async (req, res) => {
  const report = await reportsService.getBalanceSheet(req.query.asOfDate);
  res.status(200).json(new ApiResponse(200, report, 'Balance sheet fetched successfully'));
});

export const getCashBook = asyncHandler(async (req, res) => {
  const report = await reportsService.getCashBook(req.query);
  res.status(200).json(new ApiResponse(200, report, 'Cash book fetched successfully'));
});

export const getDayBook = asyncHandler(async (req, res) => {
  const report = await reportsService.getDayBook(req.query.date);
  res.status(200).json(new ApiResponse(200, report, 'Day book fetched successfully'));
});
