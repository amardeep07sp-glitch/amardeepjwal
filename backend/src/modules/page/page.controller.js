import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { pageService } from './page.service.js';
import { serializePage, serializePageList } from './page.serializer.js';

export const listPages = asyncHandler(async (req, res) => {
  const pages = await pageService.listPages();
  res.status(200).json(new ApiResponse(200, serializePageList(pages), 'Pages fetched successfully'));
});

export const getPublicPage = asyncHandler(async (req, res) => {
  const page = await pageService.getPublishedBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, serializePage(page), 'Page fetched successfully'));
});

export const createPage = asyncHandler(async (req, res) => {
  const page = await pageService.createPage(req.body);
  res.status(201).json(new ApiResponse(201, serializePage(page), 'Page created successfully'));
});

export const updatePage = asyncHandler(async (req, res) => {
  const page = await pageService.updatePage(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializePage(page), 'Page updated successfully'));
});

export const deletePage = asyncHandler(async (req, res) => {
  await pageService.deletePage(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Page deleted successfully'));
});
