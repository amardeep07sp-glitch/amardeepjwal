import mongoose from 'mongoose';
import { Event } from './event.model.js';
import { Product } from '../product/product.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const dateMatch = (dateFrom, dateTo) => buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};
const toMap = (rows) => new Map(rows.map((r) => [String(r._id), r]));

// A product_view event's metadata carries { productId, timeSpentSeconds? }
// (timeSpentSeconds is optional - the SDK reports it on page-unload via
// sendBeacon, so an early bounce may never report one, which is itself
// meaningful and not treated as zero). An order_placed event's metadata
// carries { items: [{ productId, quantity }] } - CIP trusts the
// storefront's own report of what was purchased rather than re-deriving it
// from a live Order lookup, the same self-contained-event convention every
// real analytics platform (GA4, Meta Pixel) uses for a "purchase" event.
export const productAnalyticsService = {
  async getProductPerformance({ dateFrom, dateTo, page = 1, limit = 20 } = {}) {
    const match = dateMatch(dateFrom, dateTo);

    const [views, uniqueViews, wishlists, carts, imageClicks, videoPlays, zooms, purchases] = await Promise.all([
      Event.aggregate([
        { $match: { eventType: 'product_view', ...match } },
        { $group: { _id: '$metadata.productId', count: { $sum: 1 }, avgTimeSpent: { $avg: '$metadata.timeSpentSeconds' } } },
      ]),
      Event.aggregate([
        { $match: { eventType: 'product_view', ...match } },
        { $group: { _id: { product: '$metadata.productId', visitor: '$visitorId' } } },
        { $group: { _id: '$_id.product', count: { $sum: 1 } } },
      ]),
      Event.aggregate([{ $match: { eventType: 'wishlist_add', ...match } }, { $group: { _id: '$metadata.productId', count: { $sum: 1 } } }]),
      Event.aggregate([{ $match: { eventType: 'add_to_cart', ...match } }, { $group: { _id: '$metadata.productId', count: { $sum: 1 } } }]),
      Event.aggregate([{ $match: { eventType: 'image_click', ...match } }, { $group: { _id: '$metadata.productId', count: { $sum: 1 } } }]),
      Event.aggregate([{ $match: { eventType: 'video_play', ...match } }, { $group: { _id: '$metadata.productId', count: { $sum: 1 } } }]),
      Event.aggregate([{ $match: { eventType: 'product_zoom', ...match } }, { $group: { _id: '$metadata.productId', count: { $sum: 1 } } }]),
      Event.aggregate([
        { $match: { eventType: 'order_placed', ...match } },
        { $unwind: '$metadata.items' },
        { $group: { _id: '$metadata.items.productId', unitsSold: { $sum: '$metadata.items.quantity' } } },
      ]),
    ]);

    const uniqueMap = toMap(uniqueViews);
    const wishlistMap = toMap(wishlists);
    const cartMap = toMap(carts);
    const imageClickMap = toMap(imageClicks);
    const videoPlayMap = toMap(videoPlays);
    const zoomMap = toMap(zooms);
    const purchaseMap = toMap(purchases);

    const merged = views
      .filter((v) => v._id)
      .map((v) => {
        const id = String(v._id);
        const unitsSold = purchaseMap.get(id)?.unitsSold ?? 0;
        return {
          productId: id,
          views: v.count,
          uniqueViews: uniqueMap.get(id)?.count ?? 0,
          avgTimeSpentSeconds: v.avgTimeSpent ? round2(v.avgTimeSpent) : null,
          imageClicks: imageClickMap.get(id)?.count ?? 0,
          videoPlays: videoPlayMap.get(id)?.count ?? 0,
          zooms: zoomMap.get(id)?.count ?? 0,
          wishlistAdds: wishlistMap.get(id)?.count ?? 0,
          cartAdds: cartMap.get(id)?.count ?? 0,
          unitsSold,
          conversionRate: v.count > 0 ? round2((unitsSold / v.count) * 100) : 0,
        };
      })
      .sort((a, b) => b.views - a.views);

    const total = merged.length;
    const pageItems = merged.slice((page - 1) * limit, (page - 1) * limit + limit);

    const productIds = pageItems.map((p) => new mongoose.Types.ObjectId(p.productId));
    const products = await Product.find({ _id: { $in: productIds } }).select('name sku slug');
    const productMap = new Map(products.map((p) => [String(p._id), p]));

    const items = pageItems.map((p) => ({ ...p, name: productMap.get(p.productId)?.name ?? 'Unknown product', sku: productMap.get(p.productId)?.sku ?? '' }));

    return { items, meta: { page, limit, totalItems: total, totalPages: Math.max(1, Math.ceil(total / limit)) } };
  },

  async getTopProducts({ dateFrom, dateTo, limit = 10 } = {}) {
    const { items } = await this.getProductPerformance({ dateFrom, dateTo, page: 1, limit });
    return items;
  },

  // Real "Most Viewed" signal for Collection Engine v2.0's merchandising
  // sort - scoped to a candidate id set (a collection's resolved products),
  // all-time (not date-windowed - merchandising ranking, not a reporting
  // period). Extracted out of getProductPerformance's own view-counting
  // sub-aggregation rather than duplicating it.
  getViewCountsForProductIds(productIds) {
    return Event.aggregate([
      { $match: { eventType: 'product_view', 'metadata.productId': { $in: productIds.map(String) } } },
      { $group: { _id: '$metadata.productId', views: { $sum: 1 } } },
      { $sort: { views: -1 } },
    ]);
  },

  // Revenue-ranked, from order_placed events - a dashboard card cares which
  // brands actually sold, not which were merely browsed.
  async getTopBrands({ dateFrom, dateTo, limit = 10 } = {}) {
    const match = { eventType: 'order_placed', ...dateMatch(dateFrom, dateTo) };
    const rows = await Event.aggregate([
      { $match: match },
      { $unwind: '$metadata.items' },
      { $addFields: { 'metadata.items.productObjectId': { $toObjectId: '$metadata.items.productId' } } },
      { $lookup: { from: 'products', localField: 'metadata.items.productObjectId', foreignField: '_id', as: 'product' } },
      { $unwind: '$product' },
      { $group: { _id: '$product.brand', revenue: { $sum: { $multiply: ['$metadata.items.quantity', '$metadata.items.price'] } }, unitsSold: { $sum: '$metadata.items.quantity' } } },
      { $lookup: { from: 'brands', localField: '_id', foreignField: '_id', as: 'brand' } },
      { $unwind: { path: '$brand', preserveNullAndEmptyArrays: true } },
      { $project: { _id: 0, brandId: '$_id', name: { $ifNull: ['$brand.name', 'Unbranded'] }, revenue: 1, unitsSold: 1 } },
      { $sort: { revenue: -1 } },
      { $limit: limit },
    ]);
    return rows;
  },
};
