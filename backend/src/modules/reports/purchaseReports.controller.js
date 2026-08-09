import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { purchaseReportsService } from './purchaseReports.service.js';
import { sendReportExport } from './export.util.js';

export const getPurchaseSummary = asyncHandler(async (req, res) => {
  const summary = await purchaseReportsService.getPurchaseSummary(req.query);
  res.status(200).json(new ApiResponse(200, summary, 'Purchase summary fetched successfully'));
});

const SUPPLIER_COLUMNS = [
  { key: 'name', header: 'Supplier' },
  { key: 'supplierCode', header: 'Code' },
  { key: 'orderCount', header: 'Orders' },
  { key: 'totalValue', header: 'Total Value' },
];

export const getSupplierWisePurchase = asyncHandler(async (req, res) => {
  const { format, ...query } = req.query;
  const result = await purchaseReportsService.getSupplierWisePurchase(query);
  if (format) return sendReportExport(res, format, { columns: SUPPLIER_COLUMNS, rows: result.items, filename: 'supplier-wise-purchase', title: 'Supplier-wise Purchase' });
  res.status(200).json(new ApiResponse(200, result, 'Supplier-wise purchase fetched successfully'));
});

export const getPurchaseTrend = asyncHandler(async (req, res) => {
  const trend = await purchaseReportsService.getPurchaseTrend(Number(req.query.days) || 14);
  res.status(200).json(new ApiResponse(200, trend, 'Purchase trend fetched successfully'));
});

export const getOutstandingPurchase = asyncHandler(async (req, res) => {
  const outstanding = await purchaseReportsService.getOutstandingPurchase();
  res.status(200).json(new ApiResponse(200, outstanding, 'Outstanding purchase fetched successfully'));
});

export const getGrnReport = asyncHandler(async (req, res) => {
  const result = await purchaseReportsService.getGrnReport(req.query);
  res.status(200).json(new ApiResponse(200, result, 'GRN report fetched successfully'));
});

export const getPurchaseReturnReport = asyncHandler(async (req, res) => {
  const result = await purchaseReportsService.getPurchaseReturnReport(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Purchase return report fetched successfully'));
});
