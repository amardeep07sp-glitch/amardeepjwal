import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { segmentationService } from './segmentation.service.js';
import { serializeSegmentSnapshotList } from './segmentSnapshot.serializer.js';

export const recomputeSegments = asyncHandler(async (req, res) => {
  const result = await segmentationService.recomputeAllSegments();
  res.status(200).json(new ApiResponse(200, result, 'Segments recomputed successfully'));
});

export const getSegmentCounts = asyncHandler(async (req, res) => {
  const rows = await segmentationService.getSegmentCounts();
  res.status(200).json(new ApiResponse(200, rows, 'Segment counts fetched successfully'));
});

export const listBySegment = asyncHandler(async (req, res) => {
  const result = await segmentationService.listBySegment(req.params.segmentKey, req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeSegmentSnapshotList(result.items), meta: result.meta }, 'Segment members fetched successfully'));
});
