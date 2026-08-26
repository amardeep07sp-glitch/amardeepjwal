import { ApiError } from '../../utils/ApiError.js';
import { reviewRepository } from './review.repository.js';
import { reviewReportRepository } from './reviewReport.repository.js';
import { productRepository } from '../product/product.repository.js';
import { orderItemRepository } from '../order/orderItem.repository.js';
import { activityLogService } from '../activityLog/activityLog.service.js';
import { uploadAttachments } from '../shared/attachmentUpload.util.js';
import { MEDIA_ENTITY_TYPES } from '../media/media.constants.js';
import { REVIEW_STATUSES, REVIEW_REPORT_STATUSES } from './review.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// The one place a Product's denormalized ratingAverage/reviewCount gets
// written - always a full recompute from real APPROVED reviews (never an
// incremental +1/-1), so it can never drift no matter which path changed
// a review's approved-ness (submit, edit, admin approve/reject, delete).
async function recomputeProductRating(productId) {
  const summary = await reviewRepository.getRatingSummary(productId);
  await productRepository.updateRatingSummary(productId, {
    ratingAverage: Math.round(summary.average * 10) / 10,
    reviewCount: summary.count,
  });
  return summary;
}

export const reviewService = {
  // Public product-page listing - approved only, plus the real rating
  // summary (average/count/star breakdown) for the same product.
  async listPublicForProduct(slug, { page, limit }) {
    const product = await productRepository.findPublicBySlug(slug);
    if (!product) return { items: [], meta: buildPaginationMeta(page, limit, 0), summary: { average: 0, count: 0, breakdown: {} } };

    const [{ items, total }, summary] = await Promise.all([
      reviewRepository.findApprovedForProduct(product._id, { page, limit }),
      reviewRepository.getRatingSummary(product._id),
    ]);
    return { items, meta: buildPaginationMeta(page, limit, total), summary };
  },

  // Create-or-replace, not create-only - a customer editing their existing
  // review updates the SAME row (unique product+customer index) rather
  // than erroring "you already reviewed this" and forcing a delete-first
  // round trip. An edit always re-enters moderation (status -> PENDING)
  // even if it was previously approved - the same safety rule a brand-new
  // review gets, since the edited content was never actually moderated.
  async submitMyReview(customerId, productId, { rating, title, comment, attachmentFiles }) {
    const product = await productRepository.findRawById(productId);
    if (!product) throw new ApiError(404, 'Product not found');

    const isVerifiedPurchase = await orderItemRepository.existsDeliveredForCustomerAndProduct(customerId, productId);
    const existing = await reviewRepository.findByCustomerAndProduct(customerId, productId);

    const payload = {
      rating,
      title: title ?? '',
      comment: comment ?? '',
      isVerifiedPurchase,
      status: REVIEW_STATUSES.PENDING,
      moderatedBy: null,
      moderatedAt: null,
    };

    let saved = existing
      ? await reviewRepository.updateById(existing._id, payload)
      : await reviewRepository.create({ product: productId, customer: customerId, ...payload });

    // Only touches attachments when new files actually came in on this
    // submit - an edit that doesn't re-upload photos keeps whatever was
    // attached last time rather than silently wiping them.
    if (attachmentFiles?.length) {
      const attachments = await uploadAttachments(attachmentFiles, MEDIA_ENTITY_TYPES.REVIEW, saved._id, customerId);
      saved = await reviewRepository.updateById(saved._id, { attachments });
    }

    // The review just went back to PENDING, so if it was previously
    // APPROVED and counted toward the rating, it no longer does - recompute
    // so the product's badge reflects reality immediately, not after an
    // admin eventually re-approves it.
    if (existing?.status === REVIEW_STATUSES.APPROVED) await recomputeProductRating(productId);

    return reviewRepository.findById(saved._id);
  },

  async getMyReview(customerId, productId) {
    return reviewRepository.findByCustomerAndProduct(customerId, productId);
  },

  async deleteMyReview(customerId, productId) {
    const existing = await reviewRepository.findByCustomerAndProduct(customerId, productId);
    if (!existing) throw new ApiError(404, 'Review not found');
    await reviewRepository.deleteById(existing._id);
    if (existing.status === REVIEW_STATUSES.APPROVED) await recomputeProductRating(productId);
  },

  // --- Admin moderation -----------------------------------------------------

  async listReviews(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await reviewRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async moderateReview(id, status, userId) {
    const review = await reviewRepository.updateById(id, { status, moderatedBy: userId, moderatedAt: new Date() });
    if (!review) throw new ApiError(404, 'Review not found');
    await recomputeProductRating(review.product);
    return reviewRepository.findById(id);
  },

  async deleteReview(id) {
    const review = await reviewRepository.findById(id);
    if (!review) throw new ApiError(404, 'Review not found');
    await reviewRepository.deleteById(id);
    if (review.status === REVIEW_STATUSES.APPROVED) await recomputeProductRating(review.product);
  },

  // --- Review reporting (Phase 18) - separate from the support/issue
  // pipeline by design; flows straight into this same moderation queue. ---

  async reportReview(reviewId, reporterId, { reason, description }) {
    const review = await reviewRepository.findById(reviewId);
    if (!review) throw new ApiError(404, 'Review not found');

    const existing = await reviewReportRepository.findByReviewAndReporter(reviewId, reporterId);
    if (existing) throw new ApiError(409, 'You have already reported this review');

    const report = await reviewReportRepository.create({ review: reviewId, reporterId, reason, description: description ?? '' });
    await reviewRepository.incrementReportCount(reviewId);

    await activityLogService.record({
      module: 'review',
      action: 'review.reported',
      entityId: reviewId,
      entityName: review.title || review.comment?.slice(0, 40) || '',
      performedBy: reporterId,
      metadata: { reason },
    });

    return report;
  },

  // Reviews with >=1 still-PENDING report, newest report first - an admin
  // acts on the review (approve and dismiss the reports as unfounded, or
  // reject the review and mark them actioned), not on individual duplicate
  // reports of the same review.
  async listReportedReviews({ page, limit }) {
    const { reviewIds, rowsById, total } = await reviewReportRepository.findPaginated({ page, limit });
    if (reviewIds.length === 0) return { items: [], meta: buildPaginationMeta(page, limit, 0) };

    const reviews = await reviewRepository.findByIds(reviewIds);
    const reviewById = new Map(reviews.map((r) => [String(r._id), r]));

    const items = reviewIds
      .map((id) => {
        const review = reviewById.get(String(id));
        const row = rowsById.get(String(id));
        if (!review) return null;
        return { review, pendingReportCount: row.reportCount, reasons: row.reasons, latestReportAt: row.latestAt };
      })
      .filter(Boolean);

    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  listReportsForReview(reviewId) {
    return reviewReportRepository.findByReview(reviewId);
  },

  async dismissReport(reportId, userId) {
    const report = await reviewReportRepository.updateStatus(reportId, REVIEW_REPORT_STATUSES.DISMISSED, userId);
    if (!report) throw new ApiError(404, 'Report not found');
    return report;
  },
};
