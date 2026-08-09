import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { inventoryReportsService } from './inventoryReports.service.js';
import { sendReportExport } from './export.util.js';

export const getCurrentStock = asyncHandler(async (req, res) => {
  const result = await inventoryReportsService.getCurrentStock(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Current stock fetched successfully'));
});

export const getLowStock = asyncHandler(async (req, res) => {
  const result = await inventoryReportsService.getLowStock(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Low stock fetched successfully'));
});

export const getOutOfStock = asyncHandler(async (req, res) => {
  const result = await inventoryReportsService.getOutOfStock(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Out of stock fetched successfully'));
});

const VALUATION_COLUMNS = [
  { key: 'sku', header: 'SKU' },
  { key: 'name', header: 'Product' },
  { key: 'availableQuantity', header: 'Qty' },
  { key: 'costPrice', header: 'Cost Price' },
  { key: 'value', header: 'Value' },
];

export const getInventoryValuation = asyncHandler(async (req, res) => {
  const { format, ...query } = req.query;
  const result = await inventoryReportsService.getInventoryValuation(query);
  if (format) return sendReportExport(res, format, { columns: VALUATION_COLUMNS, rows: result.items, filename: 'inventory-valuation', title: 'Inventory Valuation' });
  res.status(200).json(new ApiResponse(200, result, 'Inventory valuation fetched successfully'));
});

export const getStockMovement = asyncHandler(async (req, res) => {
  const result = await inventoryReportsService.getStockMovement(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Stock movement fetched successfully'));
});

export const getInventoryAging = asyncHandler(async (req, res) => {
  const result = await inventoryReportsService.getInventoryAging(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Inventory aging fetched successfully'));
});

export const getFastMoving = asyncHandler(async (req, res) => {
  const rows = await inventoryReportsService.getFastMoving(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Fast-moving stock fetched successfully'));
});

export const getSlowMoving = asyncHandler(async (req, res) => {
  const rows = await inventoryReportsService.getSlowMoving(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Slow-moving stock fetched successfully'));
});

export const getDeadStock = asyncHandler(async (req, res) => {
  const rows = await inventoryReportsService.getDeadStock(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Dead stock fetched successfully'));
});
