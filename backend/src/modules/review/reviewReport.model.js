import mongoose from 'mongoose';
import { REVIEW_REPORT_REASON_VALUES, REVIEW_REPORT_STATUSES, REVIEW_REPORT_STATUS_VALUES } from './review.constants.js';

// Permanent ledger of who reported a review and why - never deleted, only
// status-transitioned (pending -> dismissed|actioned), same discipline as
// CouponRedemption. Unique {review, reporterId} index makes reporting
// idempotent - a customer can't inflate Review.reportCount by spamming the
// same report repeatedly.
const reviewReportSchema = new mongoose.Schema(
  {
    review: { type: mongoose.Schema.Types.ObjectId, ref: 'Review', required: true, index: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    reason: { type: String, enum: REVIEW_REPORT_REASON_VALUES, required: true },
    description: { type: String, trim: true, default: '' },
    status: { type: String, enum: REVIEW_REPORT_STATUS_VALUES, default: REVIEW_REPORT_STATUSES.PENDING, index: true },
    resolvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    resolvedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

reviewReportSchema.index({ review: 1, reporterId: 1 }, { unique: true });

export const ReviewReport = mongoose.model('ReviewReport', reviewReportSchema);
