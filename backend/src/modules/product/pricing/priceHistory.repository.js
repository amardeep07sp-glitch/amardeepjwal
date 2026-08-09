import { PriceHistory } from './priceHistory.model.js';

export const priceHistoryRepository = {
  create(data) {
    return PriceHistory.create(data);
  },

  async findPaginatedByProduct(productId, { page, limit }) {
    const filter = { product: productId };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      PriceHistory.find(filter)
        .populate('updatedBy', 'name email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      PriceHistory.countDocuments(filter),
    ]);

    return { items, total };
  },
};
