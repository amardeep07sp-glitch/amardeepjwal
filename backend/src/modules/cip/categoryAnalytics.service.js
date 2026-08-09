import mongoose from 'mongoose';
import { Event } from './event.model.js';
import { Product } from '../product/product.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const dateMatch = (dateFrom, dateTo) => buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

export const categoryAnalyticsService = {
  async getCategoryPerformance({ dateFrom, dateTo, limit = 20 } = {}) {
    const match = dateMatch(dateFrom, dateTo);

    const [views, clicks] = await Promise.all([
      Event.aggregate([
        { $match: { eventType: 'category_view', ...match } },
        { $group: { _id: '$metadata.categoryId', count: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
      ]),
      // "Clicks" - a banner/promo click that led INTO a category, distinct
      // from arriving there directly (category_view IS the arrival, not
      // the click that caused it).
      Event.aggregate([
        { $match: { eventType: 'banner_click', 'metadata.categoryId': { $ne: null }, ...match } },
        { $group: { _id: '$metadata.categoryId', count: { $sum: 1 } } },
      ]),
    ]);

    const clickMap = new Map(clicks.map((c) => [String(c._id), c.count]));
    const ranked = views.filter((v) => v._id).sort((a, b) => b.count - a.count).slice(0, limit);

    const categoryIds = ranked.map((v) => v._id);
    const results = [];
    for (const row of ranked) {
      const categoryId = String(row._id);
      // eslint-disable-next-line no-await-in-loop
      const [conversion, exitRate] = await Promise.all([
        this._getConversionForCategory(categoryId, row.sessions, match),
        this._getExitRateForCategory(categoryId, match),
      ]);
      results.push({ categoryId, views: row.count, clicks: clickMap.get(categoryId) ?? 0, ...conversion, exitRate });
    }

    // The raw MongoDB driver (unlike Mongoose's find()/findOne()) does NOT
    // auto-cast a string to ObjectId - metadata.categoryId is always a
    // plain string (JSON has no ObjectId type), so this cast is required
    // or the lookup silently matches nothing.
    const categoryObjectIds = categoryIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id));
    const categories = await Product.db.collection('categories').find({ _id: { $in: categoryObjectIds } }).project({ name: 1 }).toArray();
    const nameMap = new Map(categories.map((c) => [String(c._id), c.name]));
    return results.map((r) => ({ ...r, name: nameMap.get(r.categoryId) ?? 'Unknown category' }));
  },

  // Fraction of sessions that viewed this category and went on to
  // purchase a product FROM that category, in the same session.
  async _getConversionForCategory(categoryId, viewSessions, match) {
    if (!viewSessions.length) return { conversion: 0 };

    const productIdsInCategory = await Product.find({ category: categoryId }).distinct('_id');
    const productIdStrings = new Set(productIdsInCategory.map(String));

    const orderEvents = await Event.find({ eventType: 'order_placed', sessionId: { $in: viewSessions }, ...match }).select('sessionId metadata.items');
    const convertedSessions = new Set();
    for (const evt of orderEvents) {
      const items = evt.metadata?.items ?? [];
      if (items.some((i) => productIdStrings.has(String(i.productId)))) {
        convertedSessions.add(evt.sessionId);
      }
    }

    return { conversion: round2((convertedSessions.size / viewSessions.length) * 100) };
  },

  // Fraction of this category's view events that were the LAST activity in
  // their session (i.e. the visitor left from there) - joins to Session's
  // own lastActivityAt rather than re-deriving "last event" from Event
  // itself, since Session already IS that answer for every sessionId.
  async _getExitRateForCategory(categoryId, match) {
    const rows = await Event.aggregate([
      { $match: { eventType: 'category_view', 'metadata.categoryId': categoryId, ...match } },
      { $lookup: { from: 'sessions', localField: 'sessionId', foreignField: 'sessionId', as: 'session' } },
      { $unwind: '$session' },
      { $group: { _id: null, total: { $sum: 1 }, exits: { $sum: { $cond: [{ $gte: ['$occurredAt', '$session.lastActivityAt'] }, 1, 0] } } } },
    ]);
    const row = rows[0];
    if (!row || row.total === 0) return 0;
    return round2((row.exits / row.total) * 100);
  },
};
