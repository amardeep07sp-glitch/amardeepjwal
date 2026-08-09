import { User } from './auth.model.js';

export const userRepository = {
  create(data) {
    return User.create(data);
  },

  findByEmail(email, { withPassword = false } = {}) {
    const query = User.findOne({ email });
    return withPassword ? query.select('+password') : query;
  },

  findByPhone(phone, { withPassword = false } = {}) {
    const query = User.findOne({ phone });
    return withPassword ? query.select('+password') : query;
  },

  findById(id, { withRefreshToken = false } = {}) {
    const query = User.findById(id);
    return withRefreshToken ? query.select('+refreshTokenHash') : query;
  },

  setRefreshTokenHash(userId, refreshTokenHash) {
    return User.findByIdAndUpdate(userId, { refreshTokenHash }, { new: true });
  },

  updateById(id, data) {
    return User.findByIdAndUpdate(id, data, { new: true, runValidators: true });
  },

  // Backs the thin admin-facing Customer directory (customer.service.js) -
  // deliberately generic (any role, optional search) rather than a
  // customer-only method, so it stays reusable if a Staff directory is ever
  // needed too.
  async findPaginatedByRole({ role, page, limit, search }) {
    const filter = { role };
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      User.find(filter).sort({ createdAt: -1 }).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    return { items, total };
  },
};
