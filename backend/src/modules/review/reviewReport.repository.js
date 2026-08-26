import { ReviewReport } from './reviewReport.model.js';
import { REVIEW_REPORT_STATUSES } from './review.constants.js';

const REPORTER_POPULATE = { path: 'reporterId', select: 'displayName' };

export const reviewReportRepository = {
  create(data) {
    return ReviewReport.create(data);
  },

  findByReviewAndReporter(reviewId, reporterId) {
    return ReviewReport.findOne({ review: reviewId, reporterId });
  },

  findByReview(reviewId) {
    return ReviewReport.find({ review: reviewId }).populate(REPORTER_POPULATE).sort({ createdAt: -1 });
  },

  findById(id) {
    return ReviewReport.findById(id);
  },

  // Admin queue - every Review with at least one PENDING report, newest
  // report first. Grouped by review (not a flat report list) since an
  // admin acts on the review, not on individual duplicate reports of it.
  async findPaginated({ page, limit }) {
    const skip = (page - 1) * limit;
    const pipeline = [
      { $match: { status: REVIEW_REPORT_STATUSES.PENDING } },
      { $group: { _id: '$review', reportCount: { $sum: 1 }, latestAt: { $max: '$createdAt' }, reasons: { $addToSet: '$reason' } } },
      { $sort: { latestAt: -1 } },
    ];
    const [rows, totalAgg] = await Promise.all([
      ReviewReport.aggregate([...pipeline, { $skip: skip }, { $limit: limit }]),
      ReviewReport.aggregate([...pipeline, { $count: 'total' }]),
    ]);
    return { reviewIds: rows.map((r) => r._id), rowsById: new Map(rows.map((r) => [String(r._id), r])), total: totalAgg[0]?.total ?? 0 };
  },

  async updateStatus(id, status, resolvedBy) {
    return ReviewReport.findByIdAndUpdate(id, { status, resolvedBy, resolvedAt: new Date() }, { new: true });
  },
};
