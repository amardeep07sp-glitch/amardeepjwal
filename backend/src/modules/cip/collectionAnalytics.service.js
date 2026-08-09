import mongoose from 'mongoose';
import { Event } from './event.model.js';
import { Product } from '../product/product.model.js';
import { Collection } from '../collection/collection.model.js';
import { buildRuleFilter } from '../collection/collection.rules.js';
import { ASSIGNMENT_TYPES } from '../collection/collection.constants.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const dateMatch = (dateFrom, dateTo) => buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

// Direct copy of categoryAnalytics.service.js#getCategoryPerformance's shape,
// onto the collection_view event this phase activates for the first time
// (cip.constants.js reserved it; nothing emitted it before now). "Clicks" is
// a banner/promo click that led INTO a collection, same category_view vs.
// banner_click distinction categoryAnalyticsService already draws.
export const collectionAnalyticsService = {
  async getCollectionPerformance({ dateFrom, dateTo, limit = 20 } = {}) {
    const match = dateMatch(dateFrom, dateTo);

    const [views, clicks] = await Promise.all([
      Event.aggregate([
        { $match: { eventType: 'collection_view', ...match } },
        { $group: { _id: '$metadata.collectionId', count: { $sum: 1 }, sessions: { $addToSet: '$sessionId' } } },
      ]),
      Event.aggregate([
        { $match: { eventType: 'banner_click', 'metadata.collectionId': { $ne: null }, ...match } },
        { $group: { _id: '$metadata.collectionId', count: { $sum: 1 } } },
      ]),
    ]);

    const clickMap = new Map(clicks.map((c) => [String(c._id), c.count]));
    const ranked = views.filter((v) => v._id).sort((a, b) => b.count - a.count).slice(0, limit);

    const collectionIds = ranked.map((v) => v._id);
    const results = [];
    for (const row of ranked) {
      const collectionId = String(row._id);
      // eslint-disable-next-line no-await-in-loop
      const [conversion, exitRate] = await Promise.all([
        this._getConversionForCollection(collectionId, row.sessions, match),
        this._getExitRateForCollection(collectionId, match),
      ]);
      results.push({ collectionId, views: row.count, clicks: clickMap.get(collectionId) ?? 0, ...conversion, exitRate });
    }

    const collectionObjectIds = collectionIds.filter((id) => mongoose.isValidObjectId(id)).map((id) => new mongoose.Types.ObjectId(id));
    const collections = await Product.db.collection('collections').find({ _id: { $in: collectionObjectIds } }).project({ name: 1 }).toArray();
    const nameMap = new Map(collections.map((c) => [String(c._id), c.name]));
    return results.map((r) => ({ ...r, name: nameMap.get(r.collectionId) ?? 'Unknown collection' }));
  },

  // A collection's membership is resolved live (never snapshotted) - manual
  // via the same collectionId ref every other public read uses, rule-based
  // via the exact same buildRuleFilter the storefront's own product grid
  // resolves against, so "which products count as this collection" never
  // drifts between what a customer sees and what conversion is measured
  // against.
  async _resolveCurrentProductIds(collectionId) {
    const collection = await Collection.findById(collectionId).select('assignmentType rules');
    if (!collection) return [];

    const filter =
      collection.assignmentType === ASSIGNMENT_TYPES.RULE_BASED
        ? buildRuleFilter(collection.rules)
        : { collectionId: collection._id };
    return Product.find(filter).distinct('_id');
  },

  // Fraction of sessions that viewed this collection and went on to
  // purchase a product currently IN it, in the same session.
  async _getConversionForCollection(collectionId, viewSessions, match) {
    if (!viewSessions.length) return { conversion: 0 };

    const productIds = await this._resolveCurrentProductIds(collectionId);
    const productIdStrings = new Set(productIds.map(String));

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

  // Fraction of this collection's view events that were the LAST activity in
  // their session - same session-join shape as categoryAnalyticsService.
  async _getExitRateForCollection(collectionId, match) {
    const rows = await Event.aggregate([
      { $match: { eventType: 'collection_view', 'metadata.collectionId': collectionId, ...match } },
      { $lookup: { from: 'sessions', localField: 'sessionId', foreignField: 'sessionId', as: 'session' } },
      { $unwind: '$session' },
      { $group: { _id: null, total: { $sum: 1 }, exits: { $sum: { $cond: [{ $gte: ['$occurredAt', '$session.lastActivityAt'] }, 1, 0] } } } },
    ]);
    const row = rows[0];
    if (!row || row.total === 0) return 0;
    return round2((row.exits / row.total) * 100);
  },
};
