import { Broadcast } from './broadcast.model.js';

export const broadcastRepository = {
  create(data) {
    return Broadcast.create(data);
  },

  findById(id) {
    return Broadcast.findById(id).populate({ path: 'createdBy', select: 'name email' });
  },

  updateById(id, data) {
    return Broadcast.findByIdAndUpdate(id, { $set: data }, { new: true });
  },

  async findPaginated({ page, limit }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Broadcast.find({}).populate({ path: 'createdBy', select: 'name email' }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      Broadcast.countDocuments({}),
    ]);
    return { items, total };
  },

  // Site-wide banner content for the customer app - active 'website'
  // broadcasts, most recent first. Bounded to a handful since a page would
  // never stack more than a few announcements at once.
  findActiveWebsite() {
    return Broadcast.find({
      channels: 'website',
      isActive: true,
      $or: [{ expiresAt: null }, { expiresAt: { $gt: new Date() } }],
    })
      .select('title message expiresAt createdAt')
      .sort({ createdAt: -1 })
      .limit(5);
  },
};
