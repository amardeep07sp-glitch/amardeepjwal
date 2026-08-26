import { Event } from './event.model.js';
import { Order } from '../order/order.model.js';
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

  // Real shipping-address state, snapshotted once per order at checkout
  // (order.model.js's addressSnapshotSchema) - never re-derived from IP/
  // geolocation, since "where the order was shipped" is an exact address
  // field the customer typed, not an approximation.
  async getOrderStateBreakdown({ dateFrom, dateTo } = {}) {
    const match = buildDateRangeMatch('createdAt', dateFrom, dateTo) ?? {};
    const rows = await Order.aggregate([
      { $match: match },
      { $group: { _id: '$shippingAddressSnapshot.state', count: { $sum: 1 } } },
      { $match: { _id: { $nin: [null, ''] } } },
      { $sort: { count: -1 } },
    ]);
    return rows;
  },
};
