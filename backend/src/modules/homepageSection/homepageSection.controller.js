import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { homepageSectionService } from './homepageSection.service.js';
import { serializeHomepageSection, serializeHomepageSectionList } from './homepageSection.serializer.js';

export const listHomepageSections = asyncHandler(async (req, res) => {
  const sections = await homepageSectionService.listSections();
  res
    .status(200)
    .json(new ApiResponse(200, serializeHomepageSectionList(sections), 'Homepage sections fetched successfully'));
});

export const createHomepageSection = asyncHandler(async (req, res) => {
  const section = await homepageSectionService.createSection(req.body);
  res.status(201).json(new ApiResponse(201, serializeHomepageSection(section), 'Homepage section created successfully'));
});

export const updateHomepageSection = asyncHandler(async (req, res) => {
  const section = await homepageSectionService.updateSection(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeHomepageSection(section), 'Homepage section updated successfully'));
});

export const deleteHomepageSection = asyncHandler(async (req, res) => {
  await homepageSectionService.deleteSection(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Homepage section deleted successfully'));
});
