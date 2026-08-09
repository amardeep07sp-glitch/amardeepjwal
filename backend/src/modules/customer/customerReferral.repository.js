import { CustomerReferral } from './customerReferral.model.js';

const POPULATE_FIELDS = [
  { path: 'referrer', select: 'displayName customerCode' },
  { path: 'referredCustomer', select: 'displayName customerCode' },
];

export const customerReferralRepository = {
  async findPaginated({ page, limit, status, referrer }) {
    const filter = {};
    if (status) filter.status = status;
    if (referrer) filter.referrer = referrer;

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      CustomerReferral.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 }).skip(skip).limit(limit),
      CustomerReferral.countDocuments(filter),
    ]);
    return { items, total };
  },

  findByReferrer(referrerId) {
    return CustomerReferral.find({ referrer: referrerId }).populate(POPULATE_FIELDS).sort({ createdAt: -1 });
  },

  findById(id) {
    return CustomerReferral.findById(id);
  },

  create(data) {
    return CustomerReferral.create(data);
  },

  async updateById(id, data) {
    const existing = await CustomerReferral.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },
};
