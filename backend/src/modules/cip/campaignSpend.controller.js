import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { campaignSpendService } from './campaignSpend.service.js';

export const listCampaignSpend = asyncHandler(async (req, res) => {
  const rows = await campaignSpendService.listSpend(req.query.utmCampaign ? { utmCampaign: req.query.utmCampaign } : {});
  res.status(200).json(new ApiResponse(200, rows, 'Campaign spend fetched successfully'));
});

export const createCampaignSpend = asyncHandler(async (req, res) => {
  const row = await campaignSpendService.createSpend(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, row, 'Campaign spend recorded successfully'));
});

export const deleteCampaignSpend = asyncHandler(async (req, res) => {
  await campaignSpendService.deleteSpend(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Campaign spend deleted successfully'));
});
