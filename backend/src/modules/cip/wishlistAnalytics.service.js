import mongoose from 'mongoose';
import { Event } from './event.model.js';
import { Product } from '../product/product.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const wishlistAnalyticsService = {
  async getMostWishlisted({ dateFrom, dateTo, limit = 20 } = {}) {
    const match = { eventType: 'wishlist_add', ...(buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {}) };
    const rows = await Event.aggregate([
      { $match: match },
      { $group: { _id: '$metadata.productId', count: { $sum: 1 } } },
      { $match: { _id: { $ne: null } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);

    const productIds = rows.map((r) => new mongoose.Types.ObjectId(r._id));
    const products = await Product.find({ _id: { $in: productIds } }).select('name sku');
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    return rows.map((r) => ({ productId: r._id, name: productMap.get(String(r._id))?.name ?? 'Unknown product', wishlistCount: r.count }));
  },

  // Fraction of products added to a wishlist that were later purchased by
  // the same visitor (any session) - "wishlist converts" per product.
  async getWishlistConversion({ dateFrom, dateTo } = {}) {
    const dateMatch = buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

    const wishlistEvents = await Event.find({ eventType: 'wishlist_add', ...dateMatch }).select('visitorId metadata.productId');
    if (wishlistEvents.length === 0) return { wishlisted: 0, converted: 0, conversionRate: 0 };

    const orderEvents = await Event.find({ eventType: 'order_placed', ...dateMatch }).select('visitorId metadata.items');

    let converted = 0;
    for (const w of wishlistEvents) {
      const purchasedByVisitor = orderEvents.some(
        (o) => o.visitorId === w.visitorId && (o.metadata?.items ?? []).some((i) => String(i.productId) === String(w.metadata?.productId))
      );
      if (purchasedByVisitor) converted += 1;
    }

    return { wishlisted: wishlistEvents.length, converted, conversionRate: round2((converted / wishlistEvents.length) * 100) };
  },
};
