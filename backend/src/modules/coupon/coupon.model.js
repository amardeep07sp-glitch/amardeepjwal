import mongoose from 'mongoose';
import { COUPON_DISCOUNT_TYPE_VALUES } from './coupon.constants.js';

// One row per successful redemption, embedded rather than a separate
// collection - a coupon's own redemption count/history is always read
// alongside the coupon itself (admin detail view, per-customer usage-limit
// check), never independently, so there's no query pattern that benefits
// from splitting it out.
const redemptionSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true },
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true },
    discountAmount: { type: Number, required: true, min: 0 },
    redeemedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    description: { type: String, trim: true, default: '' },
    discountType: { type: String, enum: COUPON_DISCOUNT_TYPE_VALUES, required: true },
    discountValue: { type: Number, required: true, min: 0 },
    // Caps a percentage discount's rupee value - ignored for flat coupons
    // (a flat coupon's own discountValue is already the cap).
    maxDiscountAmount: { type: Number, min: 0, default: null },
    minOrderValue: { type: Number, min: 0, default: 0 },
    // null = unlimited
    usageLimit: { type: Number, min: 1, default: null },
    usageLimitPerCustomer: { type: Number, min: 1, default: 1 },
    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },
    isActive: { type: Boolean, default: true },
    redemptions: { type: [redemptionSchema], default: [] },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const Coupon = mongoose.model('Coupon', couponSchema);
