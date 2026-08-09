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

  deleteByVisitor(visitorId) {
    return Session.deleteMany({ visitorId });
  },

  deleteByCustomer(customerId) {
    return Session.deleteMany({ customer: customerId });
  },
};
