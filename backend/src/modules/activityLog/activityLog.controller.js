import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { activityLogService } from './activityLog.service.js';

export const listActivityLogs = asyncHandler(async (req, res) => {
  const { items, meta } = await activityLogService.listActivity(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Activity logs fetched successfully'));
});
