import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { pricingService } from './pricing.service.js';

export const getPricing = asyncHandler(async (req, res) => {
  const pricing = await pricingService.getPricing(req.params.id);
  res.status(200).json(new ApiResponse(200, pricing, 'Pricing fetched successfully'));
});

export const updatePricing = asyncHandler(async (req, res) => {
  const pricing = await pricingService.updatePricing(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, pricing, 'Pricing updated successfully'));
});

export const getPriceHistory = asyncHandler(async (req, res) => {
  const history = await pricingService.getPriceHistory(req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, history, 'Price history fetched successfully'));
});
