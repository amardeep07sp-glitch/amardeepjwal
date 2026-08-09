import { Event } from './event.model.js';
import { campaignSpendRepository } from './campaignSpend.repository.js';
import { trafficAnalyticsService } from './trafficAnalytics.service.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

export const marketingAnalyticsService = {
  // Revenue attribution joins each order_placed event back to its
  // SESSION's traffic snapshot (captured once, at session start - see
  // session.model.js's header comment), never the order_placed event's own
  // traffic fields, which are almost always empty by the time of purchase
  // (the visitor is several pages past whatever landing URL carried the
  // UTM params). This is the one place Session's snapshot-at-start design
  // decision pays for itself.
  async getCampaignPerformance({ dateFrom, dateTo } = {}) {
    const dateMatch = buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

    const rows = await Event.aggregate([
      { $match: { eventType: 'order_placed', ...dateMatch } },
      { $lookup: { from: 'sessions', localField: 'sessionId', foreignField: 'sessionId', as: 'session' } },
      { $unwind: '$session' },
      { $match: { 'session.traffic.utmCampaign': { $nin: [null, ''] } } },
      {
        $group: {
          _id: { campaign: '$session.traffic.utmCampaign', source: '$session.traffic.utmSource', medium: '$session.traffic.utmMedium' },
          orders: { $sum: 1 },
          revenue: { $sum: '$metadata.grandTotal' },
          sessions: { $addToSet: '$sessionId' },
        },
      },
      { $project: { _id: 0, campaign: '$_id.campaign', source: '$_id.source', medium: '$_id.medium', orders: 1, revenue: 1, sessionCount: { $size: '$sessions' } } },
      { $sort: { revenue: -1 } },
    ]);

    const withRoas = [];
    for (const row of rows) {
      // eslint-disable-next-line no-await-in-loop
      const spend = await campaignSpendRepository.sumSpendForCampaign(row.campaign, dateFrom, dateTo);
      withRoas.push({ ...row, spend, roas: spend > 0 ? round2(row.revenue / spend) : null });
    }
    return withRoas;
  },

  // Thin proxies - Traffic Analytics already computes both of these
  // exactly (Marketing Analytics is a lens on the same event data, not a
  // second aggregation of it).
  getSourcePerformance(params) {
    return trafficAnalyticsService.getSourceBreakdown(params);
  },

  getTopLandingPages(params) {
    return trafficAnalyticsService.getTopLandingPages(params);
  },
};
