import { asyncHandler } from '../../../utils/asyncHandler.js';
import { ApiResponse } from '../../../utils/ApiResponse.js';
import { variantService } from './variant.service.js';

export const listVariants = asyncHandler(async (req, res) => {
  const { items, meta } = await variantService.listVariants(req.params.id, req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Variants fetched successfully'));
});

export const getVariantById = asyncHandler(async (req, res) => {
  const variant = await variantService.getVariantById(req.params.id, req.params.variantId);
  res.status(200).json(new ApiResponse(200, variant, 'Variant fetched successfully'));
});

export const createVariant = asyncHandler(async (req, res) => {
  const variant = await variantService.createVariant(req.params.id, req.body);
  res.status(201).json(new ApiResponse(201, variant, 'Variant created successfully'));
});

export const updateVariant = asyncHandler(async (req, res) => {
  const variant = await variantService.updateVariant(req.params.id, req.params.variantId, req.body);
  res.status(200).json(new ApiResponse(200, variant, 'Variant updated successfully'));
});

export const deleteVariant = asyncHandler(async (req, res) => {
  await variantService.deleteVariant(req.params.id, req.params.variantId);
  res.status(200).json(new ApiResponse(200, null, 'Variant deleted successfully'));
});

export const bulkDeleteVariants = asyncHandler(async (req, res) => {
  await variantService.bulkDelete(req.params.id, req.body.ids);
  res.status(200).json(new ApiResponse(200, null, 'Variants deleted successfully'));
});

export const bulkUpdateVariantStatus = asyncHandler(async (req, res) => {
  await variantService.bulkUpdateStatus(req.body.ids, req.body.status);
  res.status(200).json(new ApiResponse(200, null, 'Variants updated successfully'));
});

export const bulkDuplicateVariants = asyncHandler(async (req, res) => {
  const variants = await variantService.bulkDuplicate(req.params.id, req.body.ids);
  res.status(201).json(new ApiResponse(201, variants, 'Variants duplicated successfully'));
});

export const generateVariants = asyncHandler(async (req, res) => {
  const result = await variantService.generateVariants(req.params.id, req.body);
  res.status(201).json(new ApiResponse(201, result, 'Variants generated successfully'));
});
