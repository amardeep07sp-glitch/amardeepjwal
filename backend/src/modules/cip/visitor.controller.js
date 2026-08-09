import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { visitorService } from './visitor.service.js';
import { serializeVisitor, serializeVisitorList } from './visitor.serializer.js';

export const listVisitors = asyncHandler(async (req, res) => {
  const { items, total } = await visitorService.listVisitors(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeVisitorList(items), total }, 'Visitors fetched successfully'));
});

export const getVisitor = asyncHandler(async (req, res) => {
  const visitor = await visitorService.getVisitor(req.params.visitorId);
  res.status(200).json(new ApiResponse(200, visitor ? serializeVisitor(visitor) : null, 'Visitor fetched successfully'));
});
