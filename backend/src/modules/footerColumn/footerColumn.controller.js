import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { footerColumnService } from './footerColumn.service.js';

export const listFooterColumns = asyncHandler(async (req, res) => {
  const columns = await footerColumnService.listColumns();
  res.status(200).json(new ApiResponse(200, columns, 'Footer columns fetched successfully'));
});

export const listPublicFooterColumns = asyncHandler(async (req, res) => {
  const columns = await footerColumnService.listPublicColumns();
  res.status(200).json(new ApiResponse(200, columns, 'Footer columns fetched successfully'));
});

export const createFooterColumn = asyncHandler(async (req, res) => {
  const column = await footerColumnService.createColumn(req.body);
  res.status(201).json(new ApiResponse(201, column, 'Footer column created successfully'));
});

export const updateFooterColumn = asyncHandler(async (req, res) => {
  const column = await footerColumnService.updateColumn(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, column, 'Footer column updated successfully'));
});

export const deleteFooterColumn = asyncHandler(async (req, res) => {
  await footerColumnService.deleteColumn(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Footer column deleted successfully'));
});
