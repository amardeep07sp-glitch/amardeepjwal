import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { stockTransferService } from './stockTransfer.service.js';
import { serializeStockTransfer, serializeStockTransferList } from './stockTransfer.serializer.js';
import { buildPaginationMeta } from './inventory.pagination.js';

export const listTransfers = asyncHandler(async (req, res) => {
  const { page, limit, ...filters } = req.query;
  const { items, total } = await stockTransferService.listTransfers({ page, limit, ...filters });
  res.status(200).json(
    new ApiResponse(200, { items: serializeStockTransferList(items), meta: buildPaginationMeta(page, limit, total) }, 'Stock transfers fetched successfully')
  );
});

export const getTransferById = asyncHandler(async (req, res) => {
  const transfer = await stockTransferService.getTransferById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeStockTransfer(transfer), 'Stock transfer fetched successfully'));
});

export const requestTransfer = asyncHandler(async (req, res) => {
  const transfer = await stockTransferService.requestTransfer(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeStockTransfer(transfer), 'Stock transfer requested successfully'));
});

export const approveTransfer = asyncHandler(async (req, res) => {
  const transfer = await stockTransferService.approveTransfer(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeStockTransfer(transfer), 'Stock transfer approved successfully'));
});

export const rejectTransfer = asyncHandler(async (req, res) => {
  const transfer = await stockTransferService.rejectTransfer(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeStockTransfer(transfer), 'Stock transfer rejected successfully'));
});

export const completeTransfer = asyncHandler(async (req, res) => {
  const transfer = await stockTransferService.completeTransfer(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeStockTransfer(transfer), 'Stock transfer completed successfully'));
});

export const cancelTransfer = asyncHandler(async (req, res) => {
  const transfer = await stockTransferService.cancelTransfer(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeStockTransfer(transfer), 'Stock transfer cancelled successfully'));
});
