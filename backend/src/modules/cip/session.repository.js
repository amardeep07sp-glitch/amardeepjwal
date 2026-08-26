import { Session } from './session.model.js';

export const sessionRepository = {
  findBySessionId(sessionId) {
    return Session.findOne({ sessionId });
  },

  create(data) {
    return Session.create(data);
  },

  recordActivity(sessionId, { isPageView }) {
    return Session.findOneAndUpdate(
      { sessionId },
      { $set: { lastActivityAt: new Date() }, $inc: { eventCount: 1, ...(isPageView ? { pageViewCount: 1 } : {}) } },
      { new: true }
    );
  },

  recordLogin(sessionId, customerId, visitorType) {
    return Session.findOneAndUpdate(
      { sessionId },
      { $set: { loginTime: new Date(), customer: customerId, visitorType } },
      { new: true }
    );
  },

  recordLogout(sessionId) {
    return Session.findOneAndUpdate({ sessionId }, { $set: { logoutTime: new Date() } }, { new: true });
  },

  closeById(sessionId, patch) {
    return Session.findOneAndUpdate({ sessionId }, { $set: { endTime: new Date(), ...patch } }, { new: true });
  },

  // The stale-session sweep's query - every session still "open" whose
  // last activity is older than the idle cutoff.
  findStale(cutoffDate) {
    return Session.find({ endTime: null, lastActivityAt: { $lt: cutoffDate } });
  },

  // "Realtime Visitors" / "Active Sessions" - open AND recently active.
  countActive(cutoffDate) {
    return Session.countDocuments({ endTime: null, lastActivityAt: { $gte: cutoffDate } });
  },

  findPaginated({ page, limit, dateFrom, dateTo }) {
    const filter = {};
    if (dateFrom || dateTo) {
      filter.startTime = {};
      if (dateFrom) filter.startTime.$gte = new Date(dateFrom);
      if (dateTo) filter.startTime.$lte = new Date(dateTo);
    }
    const skip = (page - 1) * limit;
    return Promise.all([
      Session.find(filter).sort({ startTime: -1 }).skip(skip).limit(limit),
      Session.countDocuments(filter),
    ]).then(([items, total]) => ({ items, total }));
  },

  // Sitewide engagement KPIs (avg time on site, bounce rate %) - only ever
  // over CLOSED sessions (`endTime: {$ne: null}`), since durationSeconds/
  // isBounce are both meaningless (still 0/false) until closeSession runs
  // - an open session isn't "not a bounce", it just hasn't finished yet.
  async getEngagementSummary({ dateFrom, dateTo } = {}) {
    const filter = { endTime: { $ne: null } };
    if (dateFrom || dateTo) {
      filter.startTime = {};
      if (dateFrom) filter.startTime.$gte = new Date(dateFrom);
      if (dateTo) filter.startTime.$lte = new Date(dateTo);
    }
    const [row] = await Session.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalSessions: { $sum: 1 },
          bouncedSessions: { $sum: { $cond: ['$isBounce', 1, 0] } },
          totalDurationSeconds: { $sum: '$durationSeconds' },
        },
      },
    ]);

    const totalSessions = row?.totalSessions ?? 0;
    return {
      totalSessions,
      bouncedSessions: row?.bouncedSessions ?? 0,
      bounceRate: totalSessions > 0 ? Math.round(((row.bouncedSessions ?? 0) / totalSessions) * 1000) / 10 : 0,
      averageDurationSeconds: totalSessions > 0 ? Math.round((row.totalDurationSeconds ?? 0) / totalSessions) : 0,
    };
  },

  deleteByVisitor(visitorId) {
    return Session.deleteMany({ visitorId });
  },

  deleteByCustomer(customerId) {
    return Session.deleteMany({ customer: customerId });
  },
};
