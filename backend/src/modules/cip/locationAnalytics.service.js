import { Event } from './event.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const dateMatch = (dateFrom, dateTo) => buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

const groupBy = (field, match) =>
  Event.aggregate([
    { $match: match },
    { $group: { _id: field, count: { $sum: 1 } } },
    { $match: { _id: { $nin: [null, ''] } } },
    { $sort: { count: -1 } },
  ]);

// Every field read here is already at most city-level (see geo.util.js's
// header comment - "Never store precise GPS" is enforced upstream, at
// ingestion, not here) - this report can never leak anything more precise
// than what Event itself was allowed to store.
export const locationAnalyticsService = {
  async getLocationReport({ dateFrom, dateTo } = {}) {
    const match = dateMatch(dateFrom, dateTo);
    const [byCountry, byState, byCity] = await Promise.all([
      groupBy('$location.country', match),
      groupBy('$location.state', match),
      groupBy('$location.city', match),
    ]);
    return { byCountry, byState, byCity };
  },
};
