import { Event } from './event.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';
import { FUNNEL_STEPS } from './cip.constants.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// Homepage -> Category -> Product -> Cart -> Checkout -> Payment -> Success,
// exactly as the spec draws it - one distinct-session count per step
// (FUNNEL_STEPS, cip.constants.js), each step's drop-off measured against
// the step before it. A session only needs to have fired that step's event
// ANYWHERE within the date range to count - this is deliberately the
// simpler, standard "step reach" funnel (not a strict same-session-in-order
// requirement), the same convention GA4's own funnel reports use by
// default.
export const funnelAnalyticsService = {
  async getFunnel({ dateFrom, dateTo } = {}) {
    const dateMatch = buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

    const counts = [];
    for (const step of FUNNEL_STEPS) {
      const match = { eventType: step.eventType, ...dateMatch };
      if (step.pageType) match.pageType = step.pageType;
      // eslint-disable-next-line no-await-in-loop
      const sessions = await Event.distinct('sessionId', match);
      counts.push({ key: step.key, label: step.label, sessions: sessions.length });
    }

    return counts.map((step, i) => {
      const previous = i > 0 ? counts[i - 1].sessions : step.sessions;
      const dropOffRate = i === 0 || previous === 0 ? 0 : round2(((previous - step.sessions) / previous) * 100);
      return { ...step, dropOffRate };
    });
  },
};
