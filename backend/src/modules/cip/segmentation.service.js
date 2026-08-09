import { Order } from '../order/order.model.js';
import { Customer } from '../customer/customer.model.js';
import { Visitor } from './visitor.model.js';
import { Event } from './event.model.js';
import { segmentSnapshotRepository } from './segmentSnapshot.repository.js';
import { SEGMENT_KEYS, SEGMENT_THRESHOLDS } from './cip.constants.js';

const SETTLED_STATUSES = ['confirmed', 'packed', 'ready_to_ship', 'shipped', 'partially_shipped', 'delivered', 'partially_delivered', 'completed'];
const buildPaginationMeta = (page, limit, totalItems) => ({ page, limit, totalItems, totalPages: Math.max(1, Math.ceil(totalItems / limit)) });

// ===========================================================================
// "Auto Generate" customer segmentation - reads Order (read-only) for
// purchase-behavior segments and CIP's own Event/Visitor collections for
// browsing-behavior segments (Cart Abandoner, Window Shopper - the two
// segments that genuinely couldn't exist without an Event Engine, since
// CRM/Orders alone have no idea a customer added something to a cart and
// left). Writes ONLY to segmentSnapshot (CIP's own collection) - see that
// model's header comment for why this can never become a CRM mutation.
// ===========================================================================
export const segmentationService = {
  async recomputeAllSegments() {
    const now = new Date();
    const newCutoff = new Date(now - SEGMENT_THRESHOLDS.NEW_CUSTOMER_DAYS * 86400000);
    const inactiveCutoff = new Date(now - SEGMENT_THRESHOLDS.INACTIVE_DAYS * 86400000);
    const frequentBuyerCutoff = new Date(now - SEGMENT_THRESHOLDS.FREQUENT_BUYER_WINDOW_DAYS * 86400000);
    const cartAbandonerCutoff = new Date(now - SEGMENT_THRESHOLDS.CART_ABANDONER_WINDOW_DAYS * 86400000);

    const [orderAgg, recentOrderAgg, customers, cartAbandonVisitors, browsedVisitors] = await Promise.all([
      Order.aggregate([
        { $match: { orderStatus: { $in: SETTLED_STATUSES } } },
        { $group: { _id: '$customer', orderCount: { $sum: 1 }, lifetimeValue: { $sum: '$grandTotal' }, lastOrderAt: { $max: '$createdAt' } } },
      ]),
      Order.aggregate([
        { $match: { orderStatus: { $in: SETTLED_STATUSES }, createdAt: { $gte: frequentBuyerCutoff } } },
        { $group: { _id: '$customer', recentOrderCount: { $sum: 1 } } },
      ]),
      Customer.find({}).select('createdAt'),
      // Visitors who added to cart in the window but never ordered since.
      Event.aggregate([
        { $match: { eventType: 'add_to_cart', occurredAt: { $gte: cartAbandonerCutoff } } },
        { $group: { _id: '$visitorId' } },
      ]),
      // Visitors who browsed (product/category view) at all.
      Event.aggregate([
        { $match: { eventType: { $in: ['product_view', 'category_view'] } } },
        { $group: { _id: '$visitorId', views: { $sum: 1 } } },
        { $match: { views: { $gte: SEGMENT_THRESHOLDS.WINDOW_SHOPPER_MIN_VIEWS } } },
      ]),
    ]);

    const orderMap = new Map(orderAgg.filter((r) => r._id).map((r) => [String(r._id), r]));
    const recentOrderMap = new Map(recentOrderAgg.filter((r) => r._id).map((r) => [String(r._id), r.recentOrderCount]));
    const customerMap = new Map(customers.map((c) => [String(c._id), c]));

    const cartAbandonerVisitorIds = cartAbandonVisitors.map((v) => v._id);
    const orderedSinceCartVisitorIds = new Set(
      (await Event.distinct('visitorId', { eventType: 'order_placed', visitorId: { $in: cartAbandonerVisitorIds }, occurredAt: { $gte: cartAbandonerCutoff } }))
    );
    const trueCartAbandonerVisitorIds = cartAbandonerVisitorIds.filter((id) => !orderedSinceCartVisitorIds.has(id));

    const [cartAbandonerCustomers, windowShopperCustomers] = await Promise.all([
      Visitor.find({ visitorId: { $in: trueCartAbandonerVisitorIds }, customer: { $ne: null } }).distinct('customer'),
      Visitor.find({ visitorId: { $in: browsedVisitors.map((v) => v._id) }, customer: { $ne: null } }).distinct('customer'),
    ]);
    const cartAbandonerCustomerSet = new Set(cartAbandonerCustomers.map(String));
    const windowShopperCustomerSet = new Set(windowShopperCustomers.map(String));

    let processed = 0;
    for (const [customerId, customer] of customerMap.entries()) {
      const orderInfo = orderMap.get(customerId);
      const segments = [];
      const metrics = {};

      if (customer.createdAt >= newCutoff) segments.push(SEGMENT_KEYS.NEW_CUSTOMER);

      if (orderInfo) {
        metrics.orderCount = orderInfo.orderCount;
        metrics.lifetimeValue = orderInfo.lifetimeValue;
        metrics.lastOrderAt = orderInfo.lastOrderAt;

        if (orderInfo.orderCount >= 2) segments.push(SEGMENT_KEYS.RETURNING);
        if (orderInfo.lifetimeValue >= SEGMENT_THRESHOLDS.VIP_LIFETIME_VALUE) segments.push(SEGMENT_KEYS.VIP);
        else if (orderInfo.lifetimeValue >= SEGMENT_THRESHOLDS.HIGH_VALUE_LIFETIME_VALUE) segments.push(SEGMENT_KEYS.HIGH_VALUE);
        if (orderInfo.lastOrderAt < inactiveCutoff) segments.push(SEGMENT_KEYS.INACTIVE);
        if ((recentOrderMap.get(customerId) ?? 0) >= SEGMENT_THRESHOLDS.FREQUENT_BUYER_MIN_ORDERS) segments.push(SEGMENT_KEYS.FREQUENT_BUYER);
      } else if (windowShopperCustomerSet.has(customerId)) {
        // Only a "window shopper" if they've never actually bought anything.
        segments.push(SEGMENT_KEYS.WINDOW_SHOPPER);
      }

      if (cartAbandonerCustomerSet.has(customerId)) segments.push(SEGMENT_KEYS.CART_ABANDONER);

      if (segments.length > 0) {
        // eslint-disable-next-line no-await-in-loop
        await segmentSnapshotRepository.upsert(customerId, segments, metrics);
        processed += 1;
      }
    }

    return { customersProcessed: processed, computedAt: now };
  },

  async listBySegment(segmentKey, { page, limit }) {
    const { items, total } = await segmentSnapshotRepository.findBySegment(segmentKey, { page, limit });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  getSegmentCounts() {
    return segmentSnapshotRepository.getCounts();
  },
};
