import { LoginLocation } from './loginLocation.model.js';

export const loginLocationRepository = {
  create(data) {
    return LoginLocation.create(data);
  },

  // Newest-first, capped - the map only ever needs enough recent points to
  // draw, not every login this store has ever recorded.
  findRecent(limit) {
    return LoginLocation.find({ approxLat: { $ne: null } }).sort({ createdAt: -1 }).limit(limit);
  },

  async getStateBreakdown() {
    return LoginLocation.aggregate([
      { $match: { state: { $nin: [null, ''] } } },
      { $group: { _id: '$state', count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);
  },
};
