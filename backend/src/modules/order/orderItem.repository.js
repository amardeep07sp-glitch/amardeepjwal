import { OrderItem } from './orderItem.model.js';
import { Order } from './order.model.js';
import { ORDER_ITEM_STATUSES, ORDER_STATUSES } from './order.constants.js';

const RECEIVED_STATUSES = [ORDER_STATUSES.DELIVERED, ORDER_STATUSES.PARTIALLY_DELIVERED, ORDER_STATUSES.COMPLETED];

export const orderItemRepository = {
  findByOrder(orderId, session) {
    return OrderItem.find({ order: orderId }).sort({ createdAt: 1 }).session(session ?? null);
  },

  findById(id, session) {
    return OrderItem.findById(id).session(session ?? null);
  },

  findByIds(ids, session) {
    return OrderItem.find({ _id: { $in: ids } }).session(session ?? null);
  },

  async create(data, session) {
    const [created] = await OrderItem.create([data], { session: session ?? undefined });
    return created;
  },

  async insertMany(items, session) {
    return OrderItem.insertMany(items, { session: session ?? undefined });
  },

  updateStatus(id, status, session) {
    return OrderItem.findByIdAndUpdate(id, { $set: { status } }, { new: true, session: session ?? undefined });
  },

  updateManyStatus(ids, status, session) {
    return OrderItem.updateMany({ _id: { $in: ids } }, { $set: { status } }, { session: session ?? undefined });
  },

  // Real "Best Selling" signal for Collection Engine v2.0's merchandising
  // sort - units actually sold (cancelled items excluded), not a fabricated
  // number. Ranks a candidate set of product ids; callers slice the page
  // themselves after re-fetching in this order (see
  // collectionService.resolveCollectionProducts).
  getBestSellingProductIds(productIds, limit) {
    return OrderItem.aggregate([
      { $match: { product: { $in: productIds }, status: { $ne: ORDER_ITEM_STATUSES.CANCELLED } } },
      { $group: { _id: '$product', unitsSold: { $sum: '$quantity' } } },
      { $sort: { unitsSold: -1 } },
      { $limit: limit },
    ]);
  },

  // The storefront's "Trending Now" signal - real units sold in a recent
  // window (default caller: last 30 days), not scoped to any candidate set
  // (unlike getBestSellingProductIds, which only ranks within one
  // collection's already-resolved membership). A brand-new store with no
  // orders yet simply gets an empty array back - product.service.js backs
  // that case off to isFeatured products rather than inventing numbers here.
  getTrendingProductIds({ limit, sinceDate }) {
    return OrderItem.aggregate([
      {
        $match: {
          status: { $ne: ORDER_ITEM_STATUSES.CANCELLED },
          ...(sinceDate ? { createdAt: { $gte: sinceDate } } : {}),
        },
      },
      { $group: { _id: '$product', unitsSold: { $sum: '$quantity' } } },
      { $sort: { unitsSold: -1 } },
      { $limit: limit },
    ]);
  },

  // The "Verified Purchase" check for review.service.js - real proof the
  // reviewing customer actually received this exact product, not just
  // ordered it (a cancelled-before-delivery order doesn't count).
  async existsDeliveredForCustomerAndProduct(customerId, productId) {
    const orderIds = await Order.find({ customer: customerId, orderStatus: { $in: RECEIVED_STATUSES } }).distinct('_id');
    if (orderIds.length === 0) return false;
    const count = await OrderItem.countDocuments({ order: { $in: orderIds }, product: productId });
    return count > 0;
  },
};
