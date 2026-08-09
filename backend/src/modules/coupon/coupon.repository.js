import { Coupon } from './coupon.model.js';

const buildFilter = ({ search, isActive }) => {
  const filter = {};
  if (search) filter.code = { $regex: search.trim(), $options: 'i' };
  if (isActive !== undefined) filter.isActive = isActive;
  return filter;
};

export const couponRepository = {
  async findPaginated({ page, limit, search, isActive }) {
    const filter = buildFilter({ search, isActive });
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

  async pushRedemption(couponId, redemption) {
    return Coupon.findByIdAndUpdate(couponId, { $push: { redemptions: redemption } }, { new: true });
  },
};
