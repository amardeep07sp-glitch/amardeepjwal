import { Visitor } from './visitor.model.js';

export const visitorRepository = {
  findByVisitorId(visitorId) {
    return Visitor.findOne({ visitorId });
  },

  // Upsert-on-touch - firstSeenAt is only ever set on the insert branch
  // ($setOnInsert), every subsequent call only advances lastSeenAt/device/
  // location. THE only method permitted to create a Visitor document.
  touch(visitorId, { device, location } = {}) {
    return Visitor.findOneAndUpdate(
      { visitorId },
      {
        $setOnInsert: { visitorId, firstSeenAt: new Date() },
        $set: {
          lastSeenAt: new Date(),
          ...(device ? { lastDevice: device } : {}),
          ...(location ? { lastLocation: location } : {}),
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  },

  linkCustomer(visitorId, customerId) {
    return Visitor.findOneAndUpdate({ visitorId }, { $set: { customer: customerId } }, { new: true });
  },

  incrementSessionCount(visitorId) {
    return Visitor.findOneAndUpdate({ visitorId }, { $inc: { sessionCount: 1 } }, { new: true });
  },

  markGuestCheckout(visitorId) {
    return Visitor.findOneAndUpdate({ visitorId }, { $set: { isGuestCheckout: true } });
  },

  countNewSince(sinceDate) {
    return Visitor.countDocuments({ firstSeenAt: { $gte: sinceDate } });
  },

  countReturning() {
    return Visitor.countDocuments({ sessionCount: { $gte: 2 } });
  },

  findPaginated({ page, limit }) {
    const skip = (page - 1) * limit;
    return Promise.all([
      Visitor.find({}).sort({ lastSeenAt: -1 }).skip(skip).limit(limit),
      Visitor.countDocuments({}),
    ]).then(([items, total]) => ({ items, total }));
  },

  // Right-to-erasure support.
  deleteByVisitorId(visitorId) {
    return Visitor.deleteOne({ visitorId });
  },

  deleteByCustomer(customerId) {
    return Visitor.deleteMany({ customer: customerId });
  },
};
