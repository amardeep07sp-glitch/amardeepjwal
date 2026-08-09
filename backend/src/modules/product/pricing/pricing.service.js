import { ApiError } from '../../../utils/ApiError.js';
import { productRepository } from '../product.repository.js';
import { priceHistoryRepository } from './priceHistory.repository.js';
import { calculatePricePreview } from './priceCalculator.js';
import { serializePricing, serializePriceHistoryList } from './pricing.serializer.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const pricingService = {
  async getPricing(productId) {
    const product = await productRepository.findRawById(productId);
    if (!product) throw new ApiError(404, 'Product not found');

    const preview = calculatePricePreview(product.pricing);
    return serializePricing(product.pricing, preview);
  },

  // Every call creates a history record, per spec - even if the recalculated
  // final price happens to land on the same number as before.
  async updatePricing(productId, data, updatedByUserId) {
    const product = await productRepository.findRawById(productId);
    if (!product) throw new ApiError(404, 'Product not found');

    const { reason, ...pricingFields } = data;
    const preview = calculatePricePreview(pricingFields);
    const oldFinalPrice = product.pricing?.finalPrice ?? 0;

    product.pricing = { ...pricingFields, finalPrice: preview.finalPrice };
    await product.save();

    await priceHistoryRepository.create({
      product: productId,
      oldPrice: oldFinalPrice,
      newPrice: preview.finalPrice,
      updatedBy: updatedByUserId,
      reason: reason || '',
    });

    return serializePricing(product.pricing, preview);
  },

  async getPriceHistory(productId, { page, limit }) {
    const { items, total } = await priceHistoryRepository.findPaginatedByProduct(productId, { page, limit });
    return { items: serializePriceHistoryList(items), meta: buildPaginationMeta(page, limit, total) };
  },
};
