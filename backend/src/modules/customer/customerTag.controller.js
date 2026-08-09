import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { customerTagService } from './customerTag.service.js';
import { serializeTag, serializeTagList } from './customerTag.serializer.js';

export const listTags = asyncHandler(async (req, res) => {
  const tags = await customerTagService.listTags();
  res.status(200).json(new ApiResponse(200, serializeTagList(tags), 'Tags fetched successfully'));
});

export const createTag = asyncHandler(async (req, res) => {
  const tag = await customerTagService.createTag(req.body);
  res.status(201).json(new ApiResponse(201, serializeTag(tag), 'Tag created successfully'));
});

export const updateTag = asyncHandler(async (req, res) => {
  const tag = await customerTagService.updateTag(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeTag(tag), 'Tag updated successfully'));
});

export const deleteTag = asyncHandler(async (req, res) => {
  await customerTagService.deleteTag(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Tag deleted successfully'));
});
