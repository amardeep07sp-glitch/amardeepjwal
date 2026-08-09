import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { brandService } from './brand.service.js';

export const listBrands = asyncHandler(async (req, res) => {
  const { items, meta } = await brandService.listBrands(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Brands fetched successfully'));
});

export const getBrandById = asyncHandler(async (req, res) => {
  const brand = await brandService.getBrandById(req.params.id);
  res.status(200).json(new ApiResponse(200, brand, 'Brand fetched successfully'));
});

export const createBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.createBrand(req.body);
  res.status(201).json(new ApiResponse(201, brand, 'Brand created successfully'));
});

export const updateBrand = asyncHandler(async (req, res) => {
  const brand = await brandService.updateBrand(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, brand, 'Brand updated successfully'));
});

export const deleteBrand = asyncHandler(async (req, res) => {
  await brandService.deleteBrand(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Brand deleted successfully'));
});

export const bulkDeleteBrands = asyncHandler(async (req, res) => {
  await brandService.bulkDelete(req.body.ids);
  res.status(200).json(new ApiResponse(200, null, 'Brands deleted successfully'));
});

export const bulkUpdateBrandStatus = asyncHandler(async (req, res) => {
  await brandService.bulkUpdateStatus(req.body.ids, req.body.status);
  res.status(200).json(new ApiResponse(200, null, 'Brands updated successfully'));
});

export const listPublicBrands = asyncHandler(async (req, res) => {
  const { items, meta } = await brandService.listPublicBrands(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Brands fetched successfully'));
});

export const getPublicFeaturedBrands = asyncHandler(async (req, res) => {
  const items = await brandService.getPublicFeaturedBrands(req.query.limit);
  res.status(200).json(new ApiResponse(200, items, 'Featured brands fetched successfully'));
});

export const getPublicBrandBySlug = asyncHandler(async (req, res) => {
  const brand = await brandService.getPublicBrandBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, brand, 'Brand fetched successfully'));
});
