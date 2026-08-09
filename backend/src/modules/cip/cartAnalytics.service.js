import { Event } from './event.model.js';
import { buildDateRangeMatch } from '../reports/reportFilters.util.js';

const round2 = (n) => Math.round((n + Number.EPSILON) * 100) / 100;

// checkout_started's metadata carries { cartValue, itemCount } - the one
// point in the funnel where the storefront naturally knows the cart's
// total, reused here rather than CIP trying to reconstruct a running cart
// value from individual add_to_cart/remove_from_cart events (which would
// require CIP to model cart line-item state itself - out of scope for a
// read-only analytics platform).
export const cartAnalyticsService = {
  async getCartSummary({ dateFrom, dateTo } = {}) {
    const dateMatch = buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

    const [cartSessions, orderedSessions, valueAgg] = await Promise.all([
      Event.distinct('sessionId', { eventType: 'add_to_cart', ...dateMatch }),
      Event.distinct('sessionId', { eventType: 'order_placed', ...dateMatch }),
      Event.aggregate([
        { $match: { eventType: 'checkout_started', ...dateMatch } },
        { $group: { _id: null, totalValue: { $sum: '$metadata.cartValue' }, count: { $sum: 1 } } },
      ]),
    ]);

    const orderedSet = new Set(orderedSessions);
    const abandonedCount = cartSessions.filter((s) => !orderedSet.has(s)).length;
    const avg = valueAgg[0];

    return {
      cartsCreated: cartSessions.length,
      cartsConverted: cartSessions.filter((s) => orderedSet.has(s)).length,
      cartsAbandoned: abandonedCount,
      abandonmentRate: cartSessions.length > 0 ? round2((abandonedCount / cartSessions.length) * 100) : 0,
      averageCartValue: avg && avg.count > 0 ? round2(avg.totalValue / avg.count) : 0,
    };
  },

  // A visitor abandoned a cart in one session, then completed an order in
  // a LATER session, within the lookback window - "recovery" is measured
  // per-visitor (identity persists across sessions), not per-session.
  async getRecoveryRate({ dateFrom, dateTo } = {}) {
    const dateMatch = buildDateRangeMatch('occurredAt', dateFrom, dateTo) ?? {};

    const cartEvents = await Event.find({ eventType: 'add_to_cart', ...dateMatch }).select('visitorId sessionId occurredAt');
    const orderEvents = await Event.find({ eventType: 'order_placed', ...dateMatch }).select('visitorId sessionId occurredAt');

    const cartByVisitor = new Map();
    for (const e of cartEvents) {
      if (!cartByVisitor.has(e.visitorId)) cartByVisitor.set(e.visitorId, []);
      cartByVisitor.get(e.visitorId).push(e);
    }

    let abandoners = 0;
    let recovered = 0;
    for (const [visitorId, carts] of cartByVisitor.entries()) {
      const cartSessionIds = new Set(carts.map((c) => c.sessionId));
      const ordersForVisitor = orderEvents.filter((o) => o.visitorId === visitorId);
      const orderedInSameSession = ordersForVisitor.some((o) => cartSessionIds.has(o.sessionId));
      if (orderedInSameSession) continue; // eslint-disable-line no-continue

      abandoners += 1;
      const earliestCart = carts.reduce((min, c) => (c.occurredAt < min ? c.occurredAt : min), carts[0].occurredAt);
      const recoveredLater = ordersForVisitor.some((o) => o.occurredAt > earliestCart && !cartSessionIds.has(o.sessionId));
      if (recoveredLater) recovered += 1;
    }

    return { abandoners, recovered, recoveryRate: abandoners > 0 ? round2((recovered / abandoners) * 100) : 0 };
  },
};
