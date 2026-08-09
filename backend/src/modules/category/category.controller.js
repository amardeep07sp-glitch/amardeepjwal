import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { categoryService } from './category.service.js';

export const listCategories = asyncHandler(async (req, res) => {
  const { items, meta } = await categoryService.listCategories(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Categories fetched successfully'));
});

export const getCategoryTree = asyncHandler(async (req, res) => {
  const tree = await categoryService.getCategoryTree(req.query);
  res.status(200).json(new ApiResponse(200, tree, 'Category tree fetched successfully'));
});

export const getCategoryById = asyncHandler(async (req, res) => {
  const category = await categoryService.getCategoryById(req.params.id);
  res.status(200).json(new ApiResponse(200, category, 'Category fetched successfully'));
});

export const getCategoryBreadcrumb = asyncHandler(async (req, res) => {
  const breadcrumb = await categoryService.getCategoryBreadcrumb(req.params.id);
  res.status(200).json(new ApiResponse(200, breadcrumb, 'Category breadcrumb fetched successfully'));
});

export const listTrashedCategories = asyncHandler(async (req, res) => {
  const { items, meta } = await categoryService.listTrash(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Trashed categories fetched successfully'));
});

export const autocompleteCategories = asyncHandler(async (req, res) => {
  const results = await categoryService.searchCategories(req.query.q, req.query.limit);
  res.status(200).json(new ApiResponse(200, results, 'Category suggestions fetched successfully'));
});

export const getCategorySitemap = asyncHandler(async (req, res) => {
  const xml = await categoryService.getSitemapXml();
  res.status(200);
  res.setHeader('Content-Type', 'application/xml; charset=utf-8');
  res.send(xml);
});

export const exportCategories = asyncHandler(async (req, res) => {
  const csv = await categoryService.exportCategoriesCsv();
  res.status(200);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="categories-export-${Date.now()}.csv"`);
  res.send(csv);
});

export const importCategories = asyncHandler(async (req, res) => {
  const result = await categoryService.importCategoriesCsv(req.file.buffer, req.user._id);
  res.status(200).json(new ApiResponse(200, result, 'Category import processed'));
});

export const createCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.createCategory(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, category, 'Category created successfully'));
});

export const updateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.updateCategory(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, category, 'Category updated successfully'));
});

export const updateCategoryStatus = asyncHandler(async (req, res) => {
  const category = await categoryService.updateStatus(req.params.id, req.body.status, req.user._id);
  res.status(200).json(new ApiResponse(200, category, 'Category status updated successfully'));
});

export const reorderCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.reorderCategories(req.body.updates, req.user._id);
  res.status(200).json(new ApiResponse(200, categories, 'Categories reordered successfully'));
});

export const deleteCategory = asyncHandler(async (req, res) => {
  await categoryService.deleteCategory(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Category moved to trash'));
});

export const restoreCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.restoreCategory(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, category, 'Category restored successfully'));
});

export const permanentlyDeleteCategory = asyncHandler(async (req, res) => {
  await categoryService.permanentlyDeleteCategory(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Category permanently deleted'));
});

export const bulkDeleteCategories = asyncHandler(async (req, res) => {
  await categoryService.bulkDelete(req.body.ids, req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Categories moved to trash'));
});

export const bulkUpdateCategoryStatus = asyncHandler(async (req, res) => {
  await categoryService.bulkUpdateStatus(req.body.ids, req.body.status, req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Categories updated successfully'));
});

export const duplicateCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.duplicateCategory(req.params.id, req.user._id);
  res.status(201).json(new ApiResponse(201, category, 'Category duplicated successfully'));
});

export const mergeCategory = asyncHandler(async (req, res) => {
  const category = await categoryService.mergeCategories(req.params.id, req.body.targetId, req.user._id);
  res.status(200).json(new ApiResponse(200, category, 'Categories merged successfully'));
});

export const getCategoryAnalytics = asyncHandler(async (req, res) => {
  const { items, meta } = await categoryService.getAnalytics(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Category analytics fetched successfully'));
});

// --- Public storefront handlers (no auth) ----------------------------------

export const getPublicCategoryTree = asyncHandler(async (req, res) => {
  const tree = await categoryService.getPublicTree();
  res.status(200).json(new ApiResponse(200, tree, 'Category tree fetched successfully'));
});

export const getPublicCategoryBySlug = asyncHandler(async (req, res) => {
  const category = await categoryService.getPublicCategoryBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, category, 'Category fetched successfully'));
});

export const trackPublicCategoryClick = asyncHandler(async (req, res) => {
  await categoryService.trackCategoryClick(req.params.id);
  res.status(204).send();
});

export const getPublicFeaturedCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getFeaturedCategories(req.query.limit);
  res.status(200).json(new ApiResponse(200, categories, 'Featured categories fetched successfully'));
});

export const getPublicHomepageCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getHomepageCategories(req.query.limit);
  res.status(200).json(new ApiResponse(200, categories, 'Homepage categories fetched successfully'));
});

export const getPublicNavbarCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getNavbarCategories();
  res.status(200).json(new ApiResponse(200, categories, 'Navbar categories fetched successfully'));
});

export const getPublicTrendingCategories = asyncHandler(async (req, res) => {
  const categories = await categoryService.getTrendingCategories(req.query.limit);
  res.status(200).json(new ApiResponse(200, categories, 'Trending categories fetched successfully'));
});

export const listPublicCategories = asyncHandler(async (req, res) => {
  const { items, meta } = await categoryService.listPublicCategories(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Categories fetched successfully'));
});
