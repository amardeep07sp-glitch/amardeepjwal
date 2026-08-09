import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { salesReportsService } from './salesReports.service.js';
import { sendReportExport } from './export.util.js';

export const getSalesSummary = asyncHandler(async (req, res) => {
  const summary = await salesReportsService.getSalesSummary(req.query);
  res.status(200).json(new ApiResponse(200, summary, 'Sales summary fetched successfully'));
});

const PRODUCT_COLUMNS = [
  { key: 'name', header: 'Product' },
  { key: 'quantity', header: 'Quantity' },
  { key: 'revenue', header: 'Revenue' },
];

export const getSalesByProduct = asyncHandler(async (req, res) => {
  const { format, ...query } = req.query;
  const result = await salesReportsService.getSalesByProduct(query);
  if (format) return sendReportExport(res, format, { columns: PRODUCT_COLUMNS, rows: result.items, filename: 'sales-by-product', title: 'Sales by Product' });
  res.status(200).json(new ApiResponse(200, result, 'Sales by product fetched successfully'));
});

const CATEGORY_COLUMNS = [
  { key: 'name', header: 'Category' },
  { key: 'quantity', header: 'Quantity' },
  { key: 'revenue', header: 'Revenue' },
];

export const getSalesByCategory = asyncHandler(async (req, res) => {
  const { format, ...query } = req.query;
  const result = await salesReportsService.getSalesByCategory(query);
  if (format) return sendReportExport(res, format, { columns: CATEGORY_COLUMNS, rows: result.items, filename: 'sales-by-category', title: 'Sales by Category' });
  res.status(200).json(new ApiResponse(200, result, 'Sales by category fetched successfully'));
});

const BRAND_COLUMNS = [
  { key: 'name', header: 'Brand' },
  { key: 'quantity', header: 'Quantity' },
  { key: 'revenue', header: 'Revenue' },
];

export const getSalesByBrand = asyncHandler(async (req, res) => {
  const { format, ...query } = req.query;
  const result = await salesReportsService.getSalesByBrand(query);
  if (format) return sendReportExport(res, format, { columns: BRAND_COLUMNS, rows: result.items, filename: 'sales-by-brand', title: 'Sales by Brand' });
  res.status(200).json(new ApiResponse(200, result, 'Sales by brand fetched successfully'));
});

const CUSTOMER_COLUMNS = [
  { key: 'name', header: 'Customer' },
  { key: 'customerCode', header: 'Code' },
  { key: 'orderCount', header: 'Orders' },
  { key: 'revenue', header: 'Revenue' },
];

export const getSalesByCustomer = asyncHandler(async (req, res) => {
  const { format, ...query } = req.query;
  const result = await salesReportsService.getSalesByCustomer(query);
  if (format) return sendReportExport(res, format, { columns: CUSTOMER_COLUMNS, rows: result.items, filename: 'sales-by-customer', title: 'Sales by Customer' });
  res.status(200).json(new ApiResponse(200, result, 'Sales by customer fetched successfully'));
});

export const getSalesBySalesperson = asyncHandler(async (req, res) => {
  const rows = await salesReportsService.getSalesBySalesperson(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Sales by salesperson fetched successfully'));
});

export const getSalesByDate = asyncHandler(async (req, res) => {
  const rows = await salesReportsService.getSalesByDate(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Sales by date fetched successfully'));
});

export const getCancelledOrders = asyncHandler(async (req, res) => {
  const { items, total } = await salesReportsService.getCancelledOrders(req.query);
  res.status(200).json(new ApiResponse(200, { items, total }, 'Cancelled orders fetched successfully'));
});

export const getRefunds = asyncHandler(async (req, res) => {
  const { items, total } = await salesReportsService.getRefunds(req.query);
  res.status(200).json(new ApiResponse(200, { items, total }, 'Refunds fetched successfully'));
});
