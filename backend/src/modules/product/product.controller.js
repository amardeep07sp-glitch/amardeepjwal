import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { productService } from './product.service.js';

export const listProducts = asyncHandler(async (req, res) => {
  const { items, meta } = await productService.listProducts(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Products fetched successfully'));
});

export const getProductById = asyncHandler(async (req, res) => {
  const product = await productService.getProductById(req.params.id);
  res.status(200).json(new ApiResponse(200, product, 'Product fetched successfully'));
});

export const createProduct = asyncHandler(async (req, res) => {
  const product = await productService.createProduct(req.body);
  res.status(201).json(new ApiResponse(201, product, 'Product created successfully'));
});

export const updateProduct = asyncHandler(async (req, res) => {
  const product = await productService.updateProduct(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, product, 'Product updated successfully'));
});

export const deleteProduct = asyncHandler(async (req, res) => {
  await productService.deleteProduct(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Product deleted successfully'));
});

export const bulkDeleteProducts = asyncHandler(async (req, res) => {
  await productService.bulkDelete(req.body.ids);
  res.status(200).json(new ApiResponse(200, null, 'Products deleted successfully'));
});

export const bulkUpdateProductStatus = asyncHandler(async (req, res) => {
  await productService.bulkUpdateStatus(req.body.ids, req.body.status);
  res.status(200).json(new ApiResponse(200, null, 'Products updated successfully'));
});

export const duplicateProduct = asyncHandler(async (req, res) => {
  const product = await productService.duplicateProduct(req.params.id);
  res.status(201).json(new ApiResponse(201, product, 'Product duplicated successfully'));
});

export const previewNextSku = asyncHandler(async (req, res) => {
  const sku = await productService.previewNextSku(req.query);
  res.status(200).json(new ApiResponse(200, { sku }, 'Next SKU generated successfully'));
});

export const overrideSku = asyncHandler(async (req, res) => {
  const product = await productService.overrideSku(req.params.id, req.body.sku);
  res.status(200).json(new ApiResponse(200, product, 'SKU updated successfully'));
});

// --- Public storefront handlers (no auth) ----------------------------------

export const listPublicProducts = asyncHandler(async (req, res) => {
  const { items, meta } = await productService.listPublicProducts(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta }, 'Products fetched successfully'));
});

export const getPublicFacets = asyncHandler(async (req, res) => {
  const facets = await productService.getPublicFacets();
  res.status(200).json(new ApiResponse(200, facets, 'Facets fetched successfully'));
});

export const getPublicSearchSuggestions = asyncHandler(async (req, res) => {
  const { q, limit } = req.query;
  const suggestions = await productService.searchSuggestions({ q, limit });
  res.status(200).json(new ApiResponse(200, suggestions, 'Search suggestions fetched successfully'));
});

export const getPublicNewArrivals = asyncHandler(async (req, res) => {
  const products = await productService.getPublicNewArrivals(req.query.limit);
  res.status(200).json(new ApiResponse(200, products, 'New arrivals fetched successfully'));
});

export const getPublicFeaturedProducts = asyncHandler(async (req, res) => {
  const products = await productService.getPublicFeatured(req.query.limit);
  res.status(200).json(new ApiResponse(200, products, 'Featured products fetched successfully'));
});

export const getPublicTrendingProducts = asyncHandler(async (req, res) => {
  const products = await productService.getPublicTrending(req.query.limit);
  res.status(200).json(new ApiResponse(200, products, 'Trending products fetched successfully'));
});

export const getPublicProductBySlug = asyncHandler(async (req, res) => {
  const product = await productService.getPublicProductBySlug(req.params.slug);
  res.status(200).json(new ApiResponse(200, product, 'Product fetched successfully'));
});

export const getPublicSimilarProducts = asyncHandler(async (req, res) => {
  const products = await productService.getPublicSimilarProducts(req.params.slug, req.query.limit);
  res.status(200).json(new ApiResponse(200, products, 'Similar products fetched successfully'));
});
