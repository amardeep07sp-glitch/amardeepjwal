import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { savedFilterService } from './savedFilter.service.js';
import { serializeSavedFilter, serializeSavedFilterList } from './savedFilter.serializer.js';

export const listSavedFilters = asyncHandler(async (req, res) => {
  const filters = await savedFilterService.listForReport(req.user._id, req.query.reportKey);
  res.status(200).json(new ApiResponse(200, serializeSavedFilterList(filters), 'Saved filters fetched successfully'));
});

export const createSavedFilter = asyncHandler(async (req, res) => {
  const filter = await savedFilterService.createSavedFilter(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeSavedFilter(filter), 'Filter saved successfully'));
});

export const deleteSavedFilter = asyncHandler(async (req, res) => {
  await savedFilterService.deleteSavedFilter(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Saved filter deleted successfully'));
});
