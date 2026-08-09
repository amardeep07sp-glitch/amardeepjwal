import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { payablesService } from './payables.service.js';

export const getOutstanding = asyncHandler(async (req, res) => {
  const outstanding = await payablesService.getOutstanding();
  res.status(200).json(new ApiResponse(200, outstanding, 'Outstanding payables fetched successfully'));
});

export const getAgingReport = asyncHandler(async (req, res) => {
  const aging = await payablesService.getAgingReport(req.query.asOfDate);
  res.status(200).json(new ApiResponse(200, aging, 'Payables aging fetched successfully'));
});

export const getSupplierLedger = asyncHandler(async (req, res) => {
  const ledger = await payablesService.getSupplierLedger(req.params.supplierId);
  res.status(200).json(new ApiResponse(200, ledger, 'Supplier ledger fetched successfully'));
});
