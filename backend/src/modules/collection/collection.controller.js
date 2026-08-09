import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { collectionService } from './collection.service.js';

export const listCollections = asyncHandler(async (req, res) => {
  const { items, meta } = await collectionService.listCollections(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Collections fetched successfully'));
});

export const getCollectionById = asyncHandler(async (req, res) => {
  const collection = await collectionService.getCollectionById(req.params.id);
  res.status(200).json(new ApiResponse(200, collection, 'Collection fetched successfully'));
});

export const createCollection = asyncHandler(async (req, res) => {
  const collection = await collectionService.createCollection(req.body);
  res.status(201).json(new ApiResponse(201, collection, 'Collection created successfully'));
});

export const updateCollection = asyncHandler(async (req, res) => {
  const collection = await collectionService.updateCollection(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, collection, 'Collection updated successfully'));
});

export const deleteCollection = asyncHandler(async (req, res) => {
  await collectionService.deleteCollection(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Collection deleted successfully'));
});

export const bulkDeleteCollections = asyncHandler(async (req, res) => {
  await collectionService.bulkDelete(req.body.ids);
  res.status(200).json(new ApiResponse(200, null, 'Collections deleted successfully'));
});

export const bulkUpdateCollectionStatus = asyncHandler(async (req, res) => {
  await collectionService.bulkUpdateStatus(req.body.ids, req.body.status);
  res.status(200).json(new ApiResponse(200, null, 'Collections updated successfully'));
});

export const duplicateCollection = asyncHandler(async (req, res) => {
  const collection = await collectionService.duplicateCollection(req.params.id);
  res.status(201).json(new ApiResponse(201, collection, 'Collection duplicated successfully'));
});

// --- Admin-only Rule Builder / Merchandising helpers ------------------------

export const previewRuleMatches = asyncHandler(async (req, res) => {
  const count = await collectionService.previewRuleMatchCount(req.body);
  res.status(200).json(new ApiResponse(200, { count }, 'Match count calculated successfully'));
});

export const getCollectionProducts = asyncHandler(async (req, res) => {
  const collection = await collectionService.getCollectionById(req.params.id);
  const { page, limit } = req.query;
  const result = await collectionService.resolveCollectionProducts(collection, { page, limit });
  res.status(200).json(new ApiResponse(200, result, 'Collection products fetched successfully'));
});

export const reorderCollectionProducts = asyncHandler(async (req, res) => {
  await collectionService.reorderCollectionProducts(req.params.id, req.body.orderedIds);
  res.status(200).json(new ApiResponse(200, null, 'Collection products reordered successfully'));
});

export const getCollectionDashboardStats = asyncHandler(async (req, res) => {
  const stats = await collectionService.getDashboardStats();
  res.status(200).json(new ApiResponse(200, stats, 'Collection dashboard stats fetched successfully'));
});

// --- Public storefront -----------------------------------------------------

export const listPublicCollections = asyncHandler(async (req, res) => {
  const { items, meta } = await collectionService.getPublicCollectionList(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Collections fetched successfully'));
});

export const getPublicCollectionBySlug = asyncHandler(async (req, res) => {
  const collection = await collectionService.getPublicCollectionBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, collection, 'Collection fetched successfully'));
});

export const getPublicCollectionProducts = asyncHandler(async (req, res) => {
  const collection = await collectionService.getCollectionForPublicResolution(req.params.slug);
  const { page, limit, randomSeed, sortBy, minPrice, maxPrice } = req.query;
  const result = await collectionService.resolveCollectionProducts(collection, {
    page,
    limit,
    randomSeed,
    sortOverride: sortBy,
    minPrice,
    maxPrice,
  });
  res.status(200).json(new ApiResponse(200, result, 'Collection products fetched successfully'));
});

export const trackPublicCollectionClick = asyncHandler(async (req, res) => {
  await collectionService.trackPublicCollectionClick(req.params.id);
  res.status(204).send();
});
