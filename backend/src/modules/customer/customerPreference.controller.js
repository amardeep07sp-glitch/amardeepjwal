import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { customerPreferenceService } from './customerPreference.service.js';
import { serializePreference } from './customerPreference.serializer.js';

export const getPreference = asyncHandler(async (req, res) => {
  const preference = await customerPreferenceService.getForCustomer(req.params.customerId);
  res.status(200).json(new ApiResponse(200, serializePreference(preference), 'Preferences fetched successfully'));
});

export const updatePreference = asyncHandler(async (req, res) => {
  const preference = await customerPreferenceService.updatePreference(req.params.customerId, req.body);
  res.status(200).json(new ApiResponse(200, serializePreference(preference), 'Preferences updated successfully'));
});
