import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { bannerService } from './banner.service.js';
import { serializeBanner, serializeBannerList } from './banner.serializer.js';

export const listBanners = asyncHandler(async (req, res) => {
  const banners = await bannerService.listBanners();
  res.status(200).json(new ApiResponse(200, serializeBannerList(banners), 'Banners fetched successfully'));
});

export const createBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.createBanner(req.body);
  res.status(201).json(new ApiResponse(201, serializeBanner(banner), 'Banner created successfully'));
});

export const updateBanner = asyncHandler(async (req, res) => {
  const banner = await bannerService.updateBanner(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeBanner(banner), 'Banner updated successfully'));
});

export const deleteBanner = asyncHandler(async (req, res) => {
  await bannerService.deleteBanner(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Banner deleted successfully'));
});

export const getPublicBanners = asyncHandler(async (req, res) => {
  const banners = await bannerService.getPublicBanners(req.query.position);
  res.status(200).json(new ApiResponse(200, serializeBannerList(banners), 'Banners fetched successfully'));
});
