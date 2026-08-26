import { Coupon } from './coupon.model.js';

const buildFilter = ({ search, status, campaignId }) => {
  const filter = {};
  if (search) filter.code = { $regex: search.trim(), $options: 'i' };
  if (status) filter.status = status;
  if (campaignId) filter.campaignId = campaignId;
  return filter;
};

export const couponRepository = {
  async findPaginated({ page, limit, search, status, campaignId }) {
    const filter = buildFilter({ search, status, campaignId });
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Coupon.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Coupon.countDocuments(filter),
    ]);
    return { items, total };
  },

  findById(id) {
    return Coupon.findById(id);
  },

  // Only for the admin edit-fetch (couponService.getCouponById) - real
  // product/category/collection/brand/customer names for a coupon's scope
  // and eligibility so the admin form can show what's already selected
  // without a separate resolve-by-id round trip. Never used on the hot
  // validateForCustomer/recordRedemption paths, which only ever need raw
  // ids to compare.
  findByIdPopulated(id) {
    return Coupon.findById(id)
      .populate({ path: 'campaignId', select: 'name' })
      .populate({ path: 'scope.includeProducts', select: 'name sku' })
      .populate({ path: 'scope.excludeProducts', select: 'name sku' })
      .populate({ path: 'scope.includeCategories', select: 'name' })
      .populate({ path: 'scope.excludeCategories', select: 'name' })
      .populate({ path: 'scope.includeCollections', select: 'name' })
      .populate({ path: 'scope.excludeCollections', select: 'name' })
      .populate({ path: 'scope.includeBrands', select: 'name' })
      .populate({ path: 'scope.excludeBrands', select: 'name' })
      .populate({ path: 'eligibility.selectedCustomers', select: 'displayName' });
  },

  findByCode(code) {
    return Coupon.findOne({ code: code.trim().toUpperCase() });
  },

  create(data) {
    return Coupon.create(data);
  },

  async updateById(id, data) {
    const existing = await Coupon.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return Coupon.findByIdAndDelete(id);
  },

  // The real race-condition guard (section 31) - the filter itself
  // excludes any coupon already at its usageLimit, so the increment and
  // the limit check happen as ONE atomic database operation. Two
  // concurrent checkouts racing for the last remaining redemption can
  // never both succeed: whichever `findOneAndUpdate` the database applies
  // second sees the already-incremented `usageCount` and its own filter
  // condition fails, returning null - never `usageCount > usageLimit`.
  incrementUsage(couponId, session) {
    return Coupon.findOneAndUpdate(
      { _id: couponId, $or: [{ usageLimit: null }, { $expr: { $lt: ['$usageCount', '$usageLimit'] } }] },
      { $inc: { usageCount: 1 } },
      { new: true, session: session ?? undefined }
    );
  },

  decrementUsage(couponId, session) {
    return Coupon.findOneAndUpdate(
      { _id: couponId, usageCount: { $gt: 0 } },
      { $inc: { usageCount: -1 } },
      { new: true, session: session ?? undefined }
    );
  },
};
