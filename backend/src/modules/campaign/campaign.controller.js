import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { campaignService } from './campaign.service.js';
import { serializeCampaign, serializeCampaignList } from './campaign.serializer.js';

export const listCampaigns = asyncHandler(async (req, res) => {
  const { items, meta } = await campaignService.listCampaigns(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeCampaignList(items), meta }, 'Campaigns fetched successfully'));
});

export const getCampaignById = asyncHandler(async (req, res) => {
  const campaign = await campaignService.getCampaignById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeCampaign(campaign), 'Campaign fetched successfully'));
});

export const createCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.createCampaign(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeCampaign(campaign), 'Campaign created successfully'));
});

export const updateCampaign = asyncHandler(async (req, res) => {
  const campaign = await campaignService.updateCampaign(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeCampaign(campaign), 'Campaign updated successfully'));
});

export const deleteCampaign = asyncHandler(async (req, res) => {
  await campaignService.deleteCampaign(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Campaign deleted successfully'));
});

export const setCampaignStatus = asyncHandler(async (req, res) => {
  const campaign = await campaignService.setStatus(req.params.id, req.body.status, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeCampaign(campaign), 'Campaign status updated successfully'));
});
