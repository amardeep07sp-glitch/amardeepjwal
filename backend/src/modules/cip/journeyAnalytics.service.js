import { Event } from './event.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

// Only these event types count as a "journey milestone" - raw page_view
// noise (every single page load) would make every session's path unique
// and the aggregate unreadable, exactly why real journey-analysis tools
// collapse to a curated milestone set.
const MILESTONE_EVENT_TYPES = [
  'page_view',
  'search',
  'category_view',
  'product_view',
  'wishlist_add',
  'add_to_cart',
  'checkout_started',
  'payment_started',
  'payment_success',
  'order_placed',
];

export const journeyAnalyticsService = {
  // The literal per-session timeline the spec's example draws - already
  // served by event.service.js#getSessionJourney (returns every raw Event
  // for one sessionId, in order); no separate storage needed for "one
  // customer's journey".
  getSessionJourney(sessionId) {
    return Event.find({ sessionId }).sort({ occurredAt: 1 });
  },

  // The aggregate view: across many sessions, what are the most common
  // milestone PATHS visitors actually take? Each session's distinct,
  // ordered milestone sequence becomes one path string; paths are then
  // ranked by frequency - this is the genuinely new report "User Journey"
  // needs beyond the single-session view above.
  async getCommonPaths({ dateFrom, dateTo, sampleSize = 500, limit = 15 } = {}) {
    const dateMatch = buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

    const sessionIds = await Event.distinct('sessionId', { eventType: { $in: MILESTONE_EVENT_TYPES }, ...dateMatch });
    const sample = sessionIds.slice(0, sampleSize);

    const pathCounts = new Map();
    for (const sessionId of sample) {
      // eslint-disable-next-line no-await-in-loop
      const events = await Event.find({ sessionId, eventType: { $in: MILESTONE_EVENT_TYPES }, ...dateMatch })
        .sort({ occurredAt: 1 })
        .select('eventType');

      const path = [];
      for (const evt of events) {
        if (path[path.length - 1] !== evt.eventType) path.push(evt.eventType);
      }
      const pathKey = path.join(' → ');
      if (!pathKey) continue; // eslint-disable-line no-continue
      pathCounts.set(pathKey, (pathCounts.get(pathKey) ?? 0) + 1);
    }

    return [...pathCounts.entries()]
      .map(([path, count]) => ({ path, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, limit);
  },
};
