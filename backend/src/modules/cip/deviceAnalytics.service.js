import { Event } from './event.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const dateMatch = (dateFrom, dateTo) => buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

const groupBy = (field, match) =>
  Event.aggregate([
    { $match: match },
    { $group: { _id: field, count: { $sum: 1 } } },
    { $match: { _id: { $ne: null } } },
    { $sort: { count: -1 } },
  ]);

export const deviceAnalyticsService = {
  async getDeviceReport({ dateFrom, dateTo } = {}) {
    const match = dateMatch(dateFrom, dateTo);
    const [byType, byBrowser, byOs, byLanguage] = await Promise.all([
      groupBy('$device.type', match),
      groupBy('$device.browser', match),
      groupBy('$device.os', match),
      groupBy('$device.language', match),
    ]);
    return { byType, byBrowser, byOs, byLanguage };
  },
};
