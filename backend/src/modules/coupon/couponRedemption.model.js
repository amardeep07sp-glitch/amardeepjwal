import mongoose from 'mongoose';

export const REDEMPTION_STATUSES = Object.freeze({
  REDEEMED: 'redeemed',
  CANCELLED: 'cancelled',
  REFUNDED: 'refunded',
});

// The real, permanent audit ledger - rows here are NEVER deleted (status
// transitions instead: REDEEMED -> CANCELLED/REFUNDED). This is
// deliberately separate from Coupon.usageCount (the fast atomic gate
// checked on every validation) - this collection exists for history,
// per-customer/per-order lookups, and analytics, queried far less often
// and never on the hot checkout path.
const couponRedemptionSchema = new mongoose.Schema(
  {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', required: true, index: true },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null, index: true },
    customerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    orderId: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    code: { type: String, required: true, trim: true, uppercase: true },
    discountAmount: { type: Number, required: true, min: 0 },
    discountBase: { type: String, trim: true, default: '' },
    status: { type: String, enum: Object.values(REDEMPTION_STATUSES), default: REDEMPTION_STATUSES.REDEEMED, index: true },
    redeemedAt: { type: Date, default: Date.now },
    cancelledAt: { type: Date, default: null },
    refundedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

// One redemption per order per coupon - checkout applies a coupon exactly
// once per order, never twice, even under a retried request.
couponRedemptionSchema.index({ couponId: 1, orderId: 1 }, { unique: true });
couponRedemptionSchema.index({ customerId: 1, couponId: 1 });

export const CouponRedemption = mongoose.model('CouponRedemption', couponRedemptionSchema);
