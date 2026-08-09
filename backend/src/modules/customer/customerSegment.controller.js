import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { customerSegmentService } from './customerSegment.service.js';
import { serializeSegment, serializeSegmentList } from './customerSegment.serializer.js';

export const listSegments = asyncHandler(async (req, res) => {
  const segments = await customerSegmentService.listSegments();
  res.status(200).json(new ApiResponse(200, serializeSegmentList(segments), 'Segments fetched successfully'));
});

export const getSegmentById = asyncHandler(async (req, res) => {
  const segment = await customerSegmentService.getSegmentById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeSegment(segment), 'Segment fetched successfully'));
});

export const createSegment = asyncHandler(async (req, res) => {
  const segment = await customerSegmentService.createSegment(req.body);
  res.status(201).json(new ApiResponse(201, serializeSegment(segment), 'Segment created successfully'));
});

export const updateSegment = asyncHandler(async (req, res) => {
  const segment = await customerSegmentService.updateSegment(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeSegment(segment), 'Segment updated successfully'));
});

export const deleteSegment = asyncHandler(async (req, res) => {
  await customerSegmentService.deleteSegment(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Segment deleted successfully'));
});
