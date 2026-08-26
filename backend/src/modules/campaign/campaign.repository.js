import { Campaign } from './campaign.model.js';

export const campaignRepository = {
  async findPaginated({ page, limit, status, campaignType, search }) {
    const filter = {};
    if (status) filter.status = status;
    if (campaignType) filter.campaignType = campaignType;
    if (search) filter.name = { $regex: search.trim(), $options: 'i' };

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Campaign.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Campaign.countDocuments(filter),
    ]);
    return { items, total };
  },

  findById(id) {
    return Campaign.findById(id);
  },

  findBySlug(slug) {
    return Campaign.findOne({ slug });
  },

  create(data) {
    return Campaign.create(data);
  },

  async updateById(id, data) {
    const existing = await Campaign.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return Campaign.findByIdAndDelete(id);
  },

  // Atomic - two concurrent redemptions against the same campaign budget
  // must never both succeed past the cap (same discipline as Coupon's own
  // usage-limit increment). `$inc` + a filter that already excludes
  // over-budget documents means the DB itself enforces the ceiling, not a
  // read-then-write race in application code.
  incrementSpentBudget(id, amount, session) {
    return Campaign.findOneAndUpdate(
      { _id: id, $or: [{ budget: null }, { $expr: { $lte: [{ $add: ['$spentBudget', amount] }, '$budget'] } }] },
      { $inc: { spentBudget: amount } },
      { new: true, session: session ?? undefined }
    );
  },

  decrementSpentBudget(id, amount, session) {
    return Campaign.findByIdAndUpdate(id, { $inc: { spentBudget: -amount } }, { new: true, session: session ?? undefined });
  },
};
