import mongoose from 'mongoose';
import { CouponRedemption, REDEMPTION_STATUSES } from './couponRedemption.model.js';

export const couponRedemptionRepository = {
  async create(data, session) {
    const [created] = await CouponRedemption.create([data], { session: session ?? undefined });
    return created;
  },

  findByOrder(orderId) {
    return CouponRedemption.find({ orderId });
  },

  // Per-customer usage count for THIS coupon - only REDEEMED rows count
  // (a cancelled/refunded redemption gives the customer their use back,
  // matching the coupon's own cancellationPolicy).
  countByCustomerAndCoupon(customerId, couponId) {
    return CouponRedemption.countDocuments({ customerId, couponId, status: REDEMPTION_STATUSES.REDEEMED });
  },

  // Real usage in the current UTC day - for `dailyUsageLimit`.
  countByCouponSince(couponId, sinceDate) {
    return CouponRedemption.countDocuments({ couponId, status: REDEMPTION_STATUSES.REDEEMED, redeemedAt: { $gte: sinceDate } });
  },

  async markCancelled(orderId) {
    return CouponRedemption.updateMany(
      { orderId, status: REDEMPTION_STATUSES.REDEEMED },
      { $set: { status: REDEMPTION_STATUSES.CANCELLED, cancelledAt: new Date() } }
    );
  },

  async markRefunded(orderId) {
    return CouponRedemption.updateMany(
      { orderId, status: REDEMPTION_STATUSES.REDEEMED },
      { $set: { status: REDEMPTION_STATUSES.REFUNDED, refundedAt: new Date() } }
    );
  },

  async findPaginated({ page, limit, couponId, campaignId, customerId, status }) {
    const filter = {};
    if (couponId) filter.couponId = couponId;
    if (campaignId) filter.campaignId = campaignId;
    if (customerId) filter.customerId = customerId;
    if (status) filter.status = status;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      CouponRedemption.find(filter)
        .populate({ path: 'customerId', select: 'displayName' })
        .populate({ path: 'orderId', select: 'orderNumber grandTotal' })
        .sort({ redeemedAt: -1 })
        .skip(skip)
        .limit(limit),
      CouponRedemption.countDocuments(filter),
    ]);
    return { items, total };
  },

  // Basic analytics aggregate (section 44's scoped-down core: totals, not
  // the full ROI/funnel dashboard) - real redemption count + real
  // discount total, grouped per coupon.
  async getSummaryByCoupon(couponId) {
    // Aggregation's $match does NOT auto-cast strings to ObjectId the way
    // find()/countDocuments() do - a raw string couponId here would
    // silently match zero documents.
    const rows = await CouponRedemption.aggregate([
      { $match: { couponId: new mongoose.Types.ObjectId(couponId), status: { $ne: REDEMPTION_STATUSES.CANCELLED } } },
      { $group: { _id: '$status', count: { $sum: 1 }, totalDiscount: { $sum: '$discountAmount' } } },
    ]);
    const redeemed = rows.find((r) => r._id === REDEMPTION_STATUSES.REDEEMED) ?? { count: 0, totalDiscount: 0 };
    const refunded = rows.find((r) => r._id === REDEMPTION_STATUSES.REFUNDED) ?? { count: 0, totalDiscount: 0 };
    return {
      redemptionCount: redeemed.count,
      totalDiscountGiven: redeemed.totalDiscount,
      refundedCount: refunded.count,
    };
  },
};
