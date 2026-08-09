import { Banner } from './banner.model.js';

export const bannerRepository = {
  findAll(filter = {}) {
    return Banner.find(filter).sort({ position: 1, order: 1 }).populate('primaryMedia');
  },

  findById(id) {
    return Banner.findById(id).populate('primaryMedia');
  },

  create(data) {
    return Banner.create(data).then((banner) => banner.populate('primaryMedia'));
  },

  updateById(id, data) {
    return Banner.findByIdAndUpdate(id, data, { new: true, runValidators: true }).populate('primaryMedia');
  },

  deleteById(id) {
    return Banner.findByIdAndDelete(id);
  },

  // What the storefront is allowed to see: active, with an image (a banner
  // can be "active" at the schema level and still mid-setup in the admin's
  // eyes, but assertReadyToActivate already guarantees active implies an
  // image exists) - date-window filtering happens in the service, where
  // "now" is a single, testable value instead of baked into this query.
  findPublicByPosition(position) {
    const filter = { isActive: true, primaryMedia: { $ne: null } };
    if (position) filter.position = position;
    return Banner.find(filter).sort({ order: 1 }).populate('primaryMedia');
  },
};
