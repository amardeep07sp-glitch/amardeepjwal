import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { mediaService } from './media.service.js';

export const listMedia = asyncHandler(async (req, res) => {
  const { entityType, entityId, ...rest } = req.query;
  const result = await mediaService.listMedia(entityType, entityId, rest);
  res.status(200).json(new ApiResponse(200, result, 'Media fetched successfully'));
});

export const browseMediaLibrary = asyncHandler(async (req, res) => {
  const result = await mediaService.browseLibrary(req.query);
  res.status(200).json(new ApiResponse(200, result, 'Media library fetched successfully'));
});

export const getMediaById = asyncHandler(async (req, res) => {
  const media = await mediaService.getMediaById(req.params.id);
  res.status(200).json(new ApiResponse(200, media, 'Media fetched successfully'));
});

export const getMediaDetails = asyncHandler(async (req, res) => {
  const details = await mediaService.getMediaDetails(req.params.id);
  res.status(200).json(new ApiResponse(200, details, 'Media details fetched successfully'));
});

export const getMediaUsage = asyncHandler(async (req, res) => {
  const usage = await mediaService.getUsage(req.params.id);
  res.status(200).json(new ApiResponse(200, usage, 'Media usage fetched successfully'));
});

export const getMediaHealth = asyncHandler(async (req, res) => {
  const report = await mediaService.getHealthReport();
  res.status(200).json(new ApiResponse(200, report, 'Media health report generated successfully'));
});

export const uploadMedia = asyncHandler(async (req, res) => {
  const { entityType, entityId, variantId, altText, caption, isFeatured } = req.body;
  const media = await mediaService.uploadMedia(
    { entityType, entityId, variantId, altText, caption, isFeatured, file: req.file },
    req.user._id
  );
  res.status(201).json(new ApiResponse(201, media, 'Media uploaded successfully'));
});

export const updateMediaMetadata = asyncHandler(async (req, res) => {
  const media = await mediaService.updateMetadata(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, media, 'Media updated successfully'));
});

export const replaceMedia = asyncHandler(async (req, res) => {
  const media = await mediaService.replaceMedia(req.params.id, req.file, req.user._id);
  res.status(200).json(new ApiResponse(200, media, 'Media replaced successfully'));
});

export const deleteMedia = asyncHandler(async (req, res) => {
  await mediaService.deleteMedia(req.params.id, {
    force: req.query.force,
    requestingUserRole: req.user.role,
  });
  res.status(200).json(new ApiResponse(200, null, 'Media deleted successfully'));
});

export const bulkDeleteMedia = asyncHandler(async (req, res) => {
  await mediaService.bulkDelete(req.body.ids, {
    force: req.body.force,
    requestingUserRole: req.user.role,
  });
  res.status(200).json(new ApiResponse(200, null, 'Media deleted successfully'));
});

export const bulkArchiveMedia = asyncHandler(async (req, res) => {
  await mediaService.bulkArchive(req.body.ids);
  res.status(200).json(new ApiResponse(200, null, 'Media archived successfully'));
});

export const bulkRestoreMedia = asyncHandler(async (req, res) => {
  await mediaService.bulkRestore(req.body.ids);
  res.status(200).json(new ApiResponse(200, null, 'Media restored successfully'));
});

export const reorderMedia = asyncHandler(async (req, res) => {
  await mediaService.reorder(req.body.items);
  res.status(200).json(new ApiResponse(200, null, 'Media reordered successfully'));
});
