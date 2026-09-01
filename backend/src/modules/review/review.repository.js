import { Review } from './review.model.js';
import { REVIEW_STATUSES } from './review.constants.js';

const CUSTOMER_POPULATE = { path: 'customer', select: 'displayName' };

export const reviewRepository = {
  findByCustomerAndProduct(customerId, productId) {
    return Review.findOne({ customer: customerId, product: productId }).populate('attachments');
  },

  findById(id) {
    return Review.findById(id).populate(CUSTOMER_POPULATE).populate('attachments');
  },

  create(data) {
    return Review.create(data);
  },

  async updateById(id, data) {
    const existing = await Review.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return Review.findByIdAndDelete(id);
  },

  // Public product-page listing - approved only, newest first.
  async findApprovedForProduct(productId, { page, limit }) {
    const filter = { product: productId, status: REVIEW_STATUSES.APPROVED };
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Review.find(filter).populate(CUSTOMER_POPULATE).populate('attachments').sort({ createdAt: -1 }).skip(skip).limit(limit),
      Review.countDocuments(filter),
    ]);
    return { items, total };
  },

  // The real rating aggregate a product's card/PDP badge reads - recomputed
  // (never incrementally patched) any time a review's approved-ness could
  // have changed, so it can never drift from what's actually approved.
  async getRatingSummary(productId) {
    const rows = await Review.aggregate([
      { $match: { product: productId, status: REVIEW_STATUSES.APPROVED } },
      { $group: { _id: '$rating', count: { $sum: 1 } } },
    ]);
    const breakdown = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
    let total = 0;
    let sum = 0;
    rows.forEach((row) => {
      breakdown[row._id] = row.count;
      total += row.count;
      sum += row._id * row.count;
    });
    return { average: total > 0 ? sum / total : 0, count: total, breakdown };
  },

  // Atomic - concurrent reports on the same review can never undercount
  // (same findOneAndUpdate-increment pattern as Coupon.usageCount).
  incrementReportCount(id) {
    return Review.findByIdAndUpdate(id, { $inc: { reportCount: 1 } }, { new: true });
  },

  findByIds(ids) {
    return Review.find({ _id: { $in: ids } })
      .populate(CUSTOMER_POPULATE)
      .populate({ path: 'product', select: 'name slug' });
  },

  // Homepage "testimonials" (real, not invented copy) - approved, highly
  // rated, and with actual written text (a bare 5-star/no-comment row makes
  // a poor quote card) - across every product, newest of those first so a
  // recent great review surfaces over one from years ago.
  findFeatured({ limit }) {
    return Review.find({
      status: REVIEW_STATUSES.APPROVED,
      rating: { $gte: 4 },
      comment: { $exists: true, $ne: '' },
    })
      .populate(CUSTOMER_POPULATE)
      .populate({ path: 'product', select: 'name slug' })
      .sort({ rating: -1, createdAt: -1 })
      .limit(limit);
  },

  // Admin moderation queue - every status, searchable by product/customer
  // name via a two-step id resolution (same pattern order/invoice search use).
  async findPaginated({ page, limit, status, productId }) {
    const filter = {};
    if (status) filter.status = status;
    if (productId) filter.product = productId;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Review.find(filter)
        .populate(CUSTOMER_POPULATE)
        .populate({ path: 'product', select: 'name slug' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      Review.countDocuments(filter),
    ]);
    return { items, total };
  },
};
