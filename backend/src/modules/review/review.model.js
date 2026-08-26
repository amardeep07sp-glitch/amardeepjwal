import mongoose from 'mongoose';
import { REVIEW_STATUS_VALUES, REVIEW_STATUSES } from './review.constants.js';

// One review per (customer, product) - a customer can only ever have one
// opinion on record for a given product; editing replaces it rather than
// stacking a second row (see review.service.js#submitMyReview).
const reviewSchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    rating: { type: Number, required: true, min: 1, max: 5 },
    title: { type: String, trim: true, default: '' },
    comment: { type: String, trim: true, default: '' },
    // True the moment it's ever confirmed the reviewer actually received
    // this product (orderItem.repository.js#existsDeliveredForCustomerAndProduct)
    // - a permanent badge, never re-checked/revoked on a later return.
    isVerifiedPurchase: { type: Boolean, default: false },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    status: { type: String, enum: REVIEW_STATUS_VALUES, default: REVIEW_STATUSES.PENDING, index: true },
    moderatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    moderatedAt: { type: Date, default: null },
    // Denormalized fast counter (never the source of truth for "why") -
    // the real per-report reason/reporter/description lives in the
    // ReviewReport ledger, same denormalized-counter + permanent-ledger
    // split as Coupon.usageCount/CouponRedemption.
    reportCount: { type: Number, default: 0, index: true },
  },
  { timestamps: true }
);

reviewSchema.index({ product: 1, customer: 1 }, { unique: true });
reviewSchema.index({ product: 1, status: 1, createdAt: -1 });

export const Review = mongoose.model('Review', reviewSchema);
