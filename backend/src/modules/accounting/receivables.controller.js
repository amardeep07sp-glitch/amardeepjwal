import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { receivablesService } from './receivables.service.js';

export const getOutstanding = asyncHandler(async (req, res) => {
  const outstanding = await receivablesService.getOutstanding();
  res.status(200).json(new ApiResponse(200, outstanding, 'Outstanding receivables fetched successfully'));
});

export const getAgingReport = asyncHandler(async (req, res) => {
  const aging = await receivablesService.getAgingReport(req.query.asOfDate);
  res.status(200).json(new ApiResponse(200, aging, 'Receivables aging fetched successfully'));
});

export const getCustomerLedger = asyncHandler(async (req, res) => {
  const ledger = await receivablesService.getCustomerLedger(req.params.customerId);
  res.status(200).json(new ApiResponse(200, ledger, 'Customer ledger fetched successfully'));
});
