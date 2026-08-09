import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { taxReportsService } from './taxReports.service.js';

export const getGstSummary = asyncHandler(async (req, res) => {
  const rows = await taxReportsService.getGstSummary(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'GST summary fetched successfully'));
});

export const getCgstReport = asyncHandler(async (req, res) => {
  const rows = await taxReportsService.getCgstReport(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'CGST report fetched successfully'));
});

export const getSgstReport = asyncHandler(async (req, res) => {
  const rows = await taxReportsService.getSgstReport(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'SGST report fetched successfully'));
});

export const getIgstReport = asyncHandler(async (req, res) => {
  const rows = await taxReportsService.getIgstReport(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'IGST report fetched successfully'));
});

export const getInputTaxReport = asyncHandler(async (req, res) => {
  const rows = await taxReportsService.getInputTaxReport(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Input tax report fetched successfully'));
});

export const getOutputTaxReport = asyncHandler(async (req, res) => {
  const rows = await taxReportsService.getOutputTaxReport(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Output tax report fetched successfully'));
});

export const getTaxLiability = asyncHandler(async (req, res) => {
  const result = await taxReportsService.getTaxLiability(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Tax liability fetched successfully'));
});
