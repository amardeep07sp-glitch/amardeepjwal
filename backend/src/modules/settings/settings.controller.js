import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { settingsService } from './settings.service.js';
import { serializeSettings } from './settings.serializer.js';

export const getSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.getSettings();
  res.status(200).json(new ApiResponse(200, serializeSettings(settings), 'Settings fetched successfully'));
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await settingsService.updateSettings(req.body);
  res.status(200).json(new ApiResponse(200, serializeSettings(settings), 'Settings updated successfully'));
});
