import { Event } from './event.model.js';
import { visitorRepository } from './visitor.repository.js';
import { sessionService } from './session.service.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

export const visitorAnalyticsService = {
  // "Realtime Visitors" / "Active Sessions" - Executive Dashboard cards.
  getActiveSessionCount() {
    return sessionService.getActiveSessionCount();
  },

  async getVisitorReport({ dateFrom, dateTo } = {}) {
    const sinceDate = dateFrom ? new Date(dateFrom) : new Date(Date.now() - 29 * 86400000);

    const [newVisitors, returningVisitors, byVisitorType] = await Promise.all([
      visitorRepository.countNewSince(sinceDate),
      visitorRepository.countReturning(),
      Event.aggregate([
        { $match: { eventType: 'page_view', ...(buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {}) } },
        { $group: { _id: { visitorType: '$visitorType', visitor: '$visitorId' } } },
        { $group: { _id: '$_id.visitorType', count: { $sum: 1 } } },
      ]),
    ]);

    return { newVisitors, returningVisitors, byVisitorType };
  },
};
