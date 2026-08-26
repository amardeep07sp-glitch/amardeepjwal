import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { metalRateService } from './metalRate.service.js';
import { serializeMetalRate } from './metalRate.serializer.js';

export const getMetalRates = asyncHandler(async (req, res) => {
  const rates = await metalRateService.getRates();
  res.status(200).json(new ApiResponse(200, serializeMetalRate(rates), 'Metal rates fetched successfully'));
});

export const updateMetalRates = asyncHandler(async (req, res) => {
  const rates = await metalRateService.updateRates(req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeMetalRate(rates), 'Metal rates updated successfully'));
});

export const getPublicMetalRates = asyncHandler(async (req, res) => {
  const rates = await metalRateService.getRates();
  res.status(200).json(new ApiResponse(200, serializeMetalRate(rates), 'Metal rates fetched successfully'));
});
