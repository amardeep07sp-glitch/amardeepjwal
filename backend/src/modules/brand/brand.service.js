import { ApiError } from '../../utils/ApiError.js';
import { brandRepository } from './brand.repository.js';
import { productRepository } from '../product/product.repository.js';
import { serializeBrand, serializeBrandList, serializePublicBrand, serializePublicBrandList } from './brand.serializer.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const brandService = {
  async listBrands(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await brandRepository.findPaginated({ page, limit, ...filters });
    return { items: serializeBrandList(items), meta: buildPaginationMeta(page, limit, total) };
  },

  async getBrandById(id) {
    const brand = await brandRepository.findById(id);
    if (!brand) throw new ApiError(404, 'Brand not found');
    return serializeBrand(brand);
  },

  async createBrand(data) {
    const brand = await brandRepository.create(data);
    return serializeBrand(brand);
  },

  async updateBrand(id, data) {
    const brand = await brandRepository.updateById(id, data);
    if (!brand) throw new ApiError(404, 'Brand not found');
    return serializeBrand(brand);
  },

  // NOTE: product-existence delete guard will be added once the Product
  // module exists (Phase 6). Brands have no dependents yet.
  async deleteBrand(id) {
    const brand = await brandRepository.deleteById(id);
    if (!brand) throw new ApiError(404, 'Brand not found');
    return brand;
  },

  async bulkDelete(ids) {
    await brandRepository.deleteByIds(ids);
  },

  async bulkUpdateStatus(ids, status) {
    await brandRepository.updateManyStatus(ids, status);
  },

  // --- Public storefront reads ---------------------------------------------

  async listPublicBrands({ page, limit }) {
    const [{ items, total }, countRows] = await Promise.all([
      brandRepository.findPublicPaginated({ page, limit }),
      productRepository.getPublicBrandCounts(),
    ]);
    const countsById = new Map(countRows.map((row) => [row._id.toString(), row.count]));
    return { items: serializePublicBrandList(items, countsById), meta: buildPaginationMeta(page, limit, total) };
  },

  async getPublicFeaturedBrands(limit) {
    const [items, countRows] = await Promise.all([brandRepository.findPublicFeatured(limit), productRepository.getPublicBrandCounts()]);
    const countsById = new Map(countRows.map((row) => [row._id.toString(), row.count]));
    return serializePublicBrandList(items, countsById);
  },

  async getPublicBrandBySlug(slug) {
    const brand = await brandRepository.findPublicBySlug(slug);
    if (!brand) throw new ApiError(404, 'Brand not found');

    const countRows = await productRepository.getPublicBrandCounts();
    const productCount = countRows.find((row) => row._id.toString() === brand._id.toString())?.count ?? 0;
    return serializePublicBrand(brand, { productCount });
  },
};
