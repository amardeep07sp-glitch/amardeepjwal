import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { stockAdjustmentService } from './stockAdjustment.service.js';
import { serializeStockAdjustment, serializeStockAdjustmentList } from './stockAdjustment.serializer.js';
import { buildPaginationMeta } from './inventory.pagination.js';

export const listAdjustments = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, total } = await stockAdjustmentService.listAdjustments({ page, limit, ...filters });
  res.status(200).json(
    new ApiResponse(200, { items: serializeStockAdjustmentList(items), meta: buildPaginationMeta(page, limit, total) }, 'Stock adjustments fetched successfully')
  );
});

export const getAdjustmentById = asyncHandler(async (req, res) => {
  const adjustment = await stockAdjustmentService.getAdjustmentById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeStockAdjustment(adjustment), 'Stock adjustment fetched successfully'));
});

export const createAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await stockAdjustmentService.createAdjustment(req.body, req.user);
  res.status(201).json(new ApiResponse(201, serializeStockAdjustment(adjustment), 'Stock adjustment created successfully'));
});

export const approveAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await stockAdjustmentService.approveAdjustment(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeStockAdjustment(adjustment), 'Stock adjustment approved successfully'));
});

export const rejectAdjustment = asyncHandler(async (req, res) => {
  const adjustment = await stockAdjustmentService.rejectAdjustment(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeStockAdjustment(adjustment), 'Stock adjustment rejected successfully'));
});
