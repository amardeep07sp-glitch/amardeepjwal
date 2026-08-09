import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { customerReportsService } from './customerReports.service.js';
import { sendReportExport } from './export.util.js';

export const getCustomerGrowth = asyncHandler(async (req, res) => {
  const trend = await customerReportsService.getCustomerGrowth(Number(req.query.days) || 14);
  res.status(200).json(new ApiResponse(200, trend, 'Customer growth fetched successfully'));
});

const LTV_COLUMNS = [
  { key: 'name', header: 'Customer' },
  { key: 'customerCode', header: 'Code' },
  { key: 'orderCount', header: 'Orders' },
  { key: 'lifetimeValue', header: 'Lifetime Value' },
];

export const getCustomerLifetimeValue = asyncHandler(async (req, res) => {
  const { format, ...query } = req.query;
  const result = await customerReportsService.getCustomerLifetimeValue(query);
  if (format) return sendReportExport(res, format, { columns: LTV_COLUMNS, rows: result.items, filename: 'customer-lifetime-value', title: 'Customer Lifetime Value' });
  res.status(200).json(new ApiResponse(200, result, 'Customer lifetime value fetched successfully'));
});

export const getRepeatCustomers = asyncHandler(async (req, res) => {
  const result = await customerReportsService.getRepeatCustomers(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Repeat customers fetched successfully'));
});

export const getNewCustomers = asyncHandler(async (req, res) => {
  const result = await customerReportsService.getNewCustomers(req.query);
  res.status(200).json(new ApiResponse(200, result, 'New customers fetched successfully'));
});

export const getWalletSummary = asyncHandler(async (req, res) => {
  const summary = await customerReportsService.getWalletSummary();
  res.status(200).json(new ApiResponse(200, summary, 'Wallet summary fetched successfully'));
});

export const getLoyaltySummary = asyncHandler(async (req, res) => {
  const summary = await customerReportsService.getLoyaltySummary();
  res.status(200).json(new ApiResponse(200, summary, 'Loyalty summary fetched successfully'));
});

export const getReferralSummary = asyncHandler(async (req, res) => {
  const summary = await customerReportsService.getReferralSummary();
  res.status(200).json(new ApiResponse(200, summary, 'Referral summary fetched successfully'));
});

export const getVipCustomers = asyncHandler(async (req, res) => {
  const result = await customerReportsService.getVipCustomers(req.query);
  res.status(200).json(new ApiResponse(200, result, 'VIP customers fetched successfully'));
});
