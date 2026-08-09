import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { supplierReportsService } from './supplierReports.service.js';

export const getSupplierPerformance = asyncHandler(async (req, res) => {
  const rows = await supplierReportsService.getSupplierPerformance();
  res.status(200).json(new ApiResponse(200, rows, 'Supplier performance fetched successfully'));
});

export const getOutstandingPayables = asyncHandler(async (req, res) => {
  const rows = await supplierReportsService.getOutstandingPayables();
  res.status(200).json(new ApiResponse(200, rows, 'Outstanding payables fetched successfully'));
});

export const getPurchaseVolume = asyncHandler(async (req, res) => {
  const result = await supplierReportsService.getPurchaseVolume(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Purchase volume fetched successfully'));
});

export const getSupplierAging = asyncHandler(async (req, res) => {
  const rows = await supplierReportsService.getSupplierAging(req.query.asOfDate);
  res.status(200).json(new ApiResponse(200, rows, 'Supplier aging fetched successfully'));
});

export const getPurchaseReturnsBySupplier = asyncHandler(async (req, res) => {
  const result = await supplierReportsService.getPurchaseReturnsBySupplier(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Purchase returns by supplier fetched successfully'));
});
