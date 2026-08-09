import { ApiError } from '../../utils/ApiError.js';
import { wishlistRepository } from './wishlist.repository.js';
import { productRepository } from '../product/product.repository.js';
import { productService } from '../product/product.service.js';

export const wishlistService = {
  // Joins each favorite against the SAME real, batched product-summary
  // builder every other storefront listing uses (buildPublicProductList) -
  // no separate/duplicated product-shape logic for wishlist tiles. A
  // favorite whose product has since been unpublished/deleted quietly
  // drops from the list (findPublicByIds already excludes it) instead of
  // rendering a broken tile.
  async listForCustomer(customerId) {
    const items = await wishlistRepository.findByCustomer(customerId);
    if (items.length === 0) return [];

    const productIds = items.map((i) => i.product);
    const products = await productRepository.findPublicByIds(productIds);
    const summaries = await productService.buildPublicProductList(products);
    const summaryById = new Map(summaries.map((p) => [String(p.id), p]));

    return items
      .map((item) => ({
        id: item._id,
        variantId: item.variant ?? null,
        addedAt: item.createdAt,
        product: summaryById.get(String(item.product)) ?? null,
      }))
      .filter((row) => row.product);
  },

  async addItem(customerId, { product, variant = null }) {
    const existing = await wishlistRepository.findOne(customerId, product, variant);
    if (existing) return existing;

    const productDoc = await productRepository.findRawById(product);
    if (!productDoc) throw new ApiError(404, 'Product not found');

    return wishlistRepository.create({ customer: customerId, product, variant });
  },

  async removeItem(customerId, product, variant = null) {
    const deleted = await wishlistRepository.deleteOne(customerId, product, variant);
    if (!deleted) throw new ApiError(404, 'Wishlist item not found');
  },
};
