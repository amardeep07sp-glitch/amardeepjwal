import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { helpService } from './help.service.js';
import { activityLogService } from '../activityLog/activityLog.service.js';
import {
  serializeHelpArticle,
  serializeHelpArticleList,
  serializePublicHelpArticle,
  serializePublicHelpArticleList,
} from './helpArticle.serializer.js';

// ---- Admin CMS ----

export const listArticlesAdmin = asyncHandler(async (req, res) => {
  const { items, meta } = await helpService.listArticlesAdmin(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeHelpArticleList(items), meta }, 'Help articles fetched successfully'));
});

export const getArticleByIdAdmin = asyncHandler(async (req, res) => {
  const article = await helpService.getArticleById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeHelpArticle(article), 'Help article fetched successfully'));
});

export const createArticle = asyncHandler(async (req, res) => {
  const article = await helpService.createArticle(req.body, req.user._id);
  await activityLogService.record({ module: 'help', action: 'article.created', entityId: article._id, entityName: article.title, performedBy: req.user._id });
  res.status(201).json(new ApiResponse(201, serializeHelpArticle(article), 'Help article created successfully'));
});

export const updateArticle = asyncHandler(async (req, res) => {
  const article = await helpService.updateArticle(req.params.id, req.body, req.user._id);
  await activityLogService.record({ module: 'help', action: 'article.updated', entityId: article._id, entityName: article.title, performedBy: req.user._id, metadata: { fields: Object.keys(req.body) } });
  res.status(200).json(new ApiResponse(200, serializeHelpArticle(article), 'Help article updated successfully'));
});

export const deleteArticle = asyncHandler(async (req, res) => {
  await helpService.deleteArticle(req.params.id);
  await activityLogService.record({ module: 'help', action: 'article.deleted', entityId: req.params.id, performedBy: req.user._id });
  res.status(200).json(new ApiResponse(200, null, 'Help article deleted successfully'));
});

export const getSearchAnalytics = asyncHandler(async (req, res) => {
  const analytics = await helpService.getSearchAnalytics();
  res.status(200).json(new ApiResponse(200, analytics, 'Search analytics fetched successfully'));
});

export const listCategoriesAdmin = asyncHandler(async (req, res) => {
  const categories = await helpService.listCategoriesAdmin();
  res.status(200).json(new ApiResponse(200, categories, 'Help categories fetched successfully'));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await helpService.updateCategory(req.params.code, req.body, req.user._id);
  await activityLogService.record({ module: 'help', action: 'category.updated', entityId: category._id, entityName: category.code, performedBy: req.user._id });
  res.status(200).json(new ApiResponse(200, category, 'Help category updated successfully'));
});

// ---- Public Help Center ----

export const listCategories = asyncHandler(async (req, res) => {
  const categories = await helpService.listCategories();
  res.status(200).json(new ApiResponse(200, categories, 'Help categories fetched successfully'));
});

export const listPublishedArticles = asyncHandler(async (req, res) => {
  const { items, meta } = await helpService.listPublishedArticles(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializePublicHelpArticleList(items), meta }, 'Help articles fetched successfully'));
});

export const getFeaturedArticles = asyncHandler(async (req, res) => {
  const articles = await helpService.getFeaturedArticles(req.query.limit);
  res.status(200).json(new ApiResponse(200, serializePublicHelpArticleList(articles), 'Featured help articles fetched successfully'));
});

export const searchArticles = asyncHandler(async (req, res) => {
  const { items, meta } = await helpService.search(req.query, req.user?._id);
  res.status(200).json(new ApiResponse(200, { items: serializePublicHelpArticleList(items), meta }, 'Search results fetched successfully'));
});

export const getPublishedArticleBySlug = asyncHandler(async (req, res) => {
  const article = await helpService.getPublishedArticleBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, serializePublicHelpArticle(article), 'Help article fetched successfully'));
});

export const voteHelpful = asyncHandler(async (req, res) => {
  const result = await helpService.voteHelpful(req.params.slug, req.body.helpful);
  res.status(200).json(new ApiResponse(200, result, 'Thanks for your feedback'));
});
