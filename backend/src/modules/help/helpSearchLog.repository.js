import { HelpSearchLog } from './helpSearchLog.model.js';

export const helpSearchLogRepository = {
  create(data) {
    return HelpSearchLog.create(data);
  },

  // Case-insensitive grouping (`toLower`) so "Gold Rate" and "gold rate"
  // count as the same popular query rather than splitting analytics
  // across casing variants a real search bar will naturally produce.
  async getTopQueries({ limit = 20, noResultsOnly = false } = {}) {
    const match = noResultsOnly ? { resultCount: 0 } : {};
    return HelpSearchLog.aggregate([
      { $match: match },
      { $group: { _id: { $toLower: '$query' }, count: { $sum: 1 }, lastSearchedAt: { $max: '$createdAt' } } },
      { $sort: { count: -1 } },
      { $limit: limit },
      { $project: { _id: 0, query: '$_id', count: 1, lastSearchedAt: 1 } },
    ]);
  },

  async getSummary() {
    const [totals] = await HelpSearchLog.aggregate([
      { $group: { _id: null, totalSearches: { $sum: 1 }, noResultSearches: { $sum: { $cond: [{ $eq: ['$resultCount', 0] }, 1, 0] } } } },
    ]);
    return { totalSearches: totals?.totalSearches ?? 0, noResultSearches: totals?.noResultSearches ?? 0 };
  },
};
