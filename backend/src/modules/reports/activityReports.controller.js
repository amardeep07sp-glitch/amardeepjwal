import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { activityReportsService } from './activityReports.service.js';

export const getUserActivity = asyncHandler(async (req, res) => {
  const result = await activityReportsService.getUserActivity(req.query);
  res.status(200).json(new ApiResponse(200, result, 'User activity fetched successfully'));
});

export const getCustomerActivity = asyncHandler(async (req, res) => {
  const result = await activityReportsService.getCustomerActivity(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Customer activity fetched successfully'));
});

export const getSupplierActivity = asyncHandler(async (req, res) => {
  const result = await activityReportsService.getSupplierActivity(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Supplier activity fetched successfully'));
});

export const getAuditLogs = asyncHandler(async (req, res) => {
  const result = await activityReportsService.getAuditLogs(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Audit logs fetched successfully'));
});

export const getTimelineReport = asyncHandler(async (req, res) => {
  const rows = await activityReportsService.getTimelineReport(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Timeline report fetched successfully'));
});
