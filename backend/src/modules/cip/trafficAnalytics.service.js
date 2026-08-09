import { Event } from './event.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const dateMatch = (dateFrom, dateTo) => buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

export const trafficAnalyticsService = {
  async getSourceBreakdown({ dateFrom, dateTo } = {}) {
    const match = { eventType: 'page_view', ...dateMatch(dateFrom, dateTo) };
    return Event.aggregate([
      { $match: match },
      { $group: { _id: '$traffic.source', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  },

  async getUtmCampaignReport({ dateFrom, dateTo } = {}) {
    const match = { eventType: 'page_view', 'traffic.utmCampaign': { $nin: [null, ''] }, ...dateMatch(dateFrom, dateTo) };
    return Event.aggregate([
      { $match: match },
      {
        $group: {
          _id: { campaign: '$traffic.utmCampaign', source: '$traffic.utmSource', medium: '$traffic.utmMedium' },
          visits: { $sum: 1 },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      { $project: { _id: 0, campaign: '$_id.campaign', source: '$_id.source', medium: '$_id.medium', visits: 1, sessionCount: { $size: '$sessions' } } },
      { $sort: { visits: -1 } },
    ]);
  },

  async getTopLandingPages({ dateFrom, dateTo, limit = 20 } = {}) {
    const match = { eventType: 'page_view', 'traffic.landingPage': { $nin: [null, ''] }, ...dateMatch(dateFrom, dateTo) };
    return Event.aggregate([
      { $match: match },
      { $group: { _id: '$traffic.landingPage', visits: { $sum: 1 } } },
      { $sort: { visits: -1 } },
      { $limit: limit },
    ]);
  },
};
