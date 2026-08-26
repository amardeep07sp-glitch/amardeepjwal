import { Feedback } from './feedback.model.js';

const CUSTOMER_POPULATE = { path: 'customer', select: 'displayName phone email' };

export const feedbackRepository = {
  async findPaginated({ page, limit, category, customerId }) {
    const filter = {};
    if (category) filter.category = category;
    if (customerId) filter.customer = customerId;
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Feedback.find(filter).populate(CUSTOMER_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Feedback.countDocuments(filter),
    ]);
    return { items, total };
  },

  create(data) {
    return Feedback.create(data);
  },

  async getSummary() {
    const rows = await Feedback.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 }, avgRating: { $avg: '$rating' } } },
    ]);
    return rows.map((r) => ({ category: r._id, count: r.count, avgRating: r.avgRating != null ? Math.round(r.avgRating * 10) / 10 : null }));
  },
};
