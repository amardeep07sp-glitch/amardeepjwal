import { Event } from './event.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;
const dateMatch = (dateFrom, dateTo) => buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

// Every method here expects a `search` event's metadata to carry
// { query, resultCount } - the SDK's contract for that one event type
// (see event.public.routes.js's ingestion endpoint; nothing enforces the
// shape server-side beyond what sanitizeMetadata strips, by design - CIP
// stays event-type-agnostic about payload shape everywhere except where a
// report specifically needs a field).
export const searchAnalyticsService = {
  async getTopSearches({ dateFrom, dateTo, limit = 20 } = {}) {
    const match = { eventType: 'search', ...dateMatch(dateFrom, dateTo) };
    return Event.aggregate([
      { $match: match },
      { $group: { _id: '$metadata.query', count: { $sum: 1 }, avgResultCount: { $avg: '$metadata.resultCount' } } },
      { $match: { _id: { $nin: [null, ''] } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
  },

  async getNoResultSearches({ dateFrom, dateTo, limit = 20 } = {}) {
    const match = { eventType: 'search', 'metadata.resultCount': 0, ...dateMatch(dateFrom, dateTo) };
    return Event.aggregate([
      { $match: match },
      { $group: { _id: '$metadata.query', count: { $sum: 1 } } },
      { $match: { _id: { $nin: [null, ''] } } },
      { $sort: { count: -1 } },
      { $limit: limit },
    ]);
  },

  // "Trending Searches" - the same Top Searches shape, just scoped to a
  // short recent window by the caller (dateFrom = last 24h/7d) rather than
  // a separate aggregation.
  getTrendingSearches({ hours = 24, limit = 10 } = {}) {
    const sinceDate = new Date(Date.now() - hours * 60 * 60 * 1000);
    return this.getTopSearches({ dateFrom: sinceDate.toISOString(), limit });
  },

  // Fraction of sessions that searched and went on to place an order in
  // that same session - the standard "search converts" metric.
  async getSearchConversion({ dateFrom, dateTo } = {}) {
    const match = dateMatch(dateFrom, dateTo);
    const searchSessions = await Event.distinct('sessionId', { eventType: 'search', ...match });
    if (searchSessions.length === 0) return { searchSessions: 0, convertedSessions: 0, conversionRate: 0 };

    const convertedSessions = await Event.distinct('sessionId', {
      eventType: 'order_placed',
      sessionId: { $in: searchSessions },
      ...match,
    });

    return {
      searchSessions: searchSessions.length,
      convertedSessions: convertedSessions.length,
      conversionRate: round2((convertedSessions.length / searchSessions.length) * 100),
    };
  },
};
