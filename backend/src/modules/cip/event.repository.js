import { Event } from './event.model.js';

export const eventRepository = {
  async create(data) {
    return Event.create(data);
  },

  async findPaginated({ page, limit, eventType, sessionId, visitorId, customer, dateFrom, dateTo }) {
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (sessionId) filter.sessionId = sessionId;
    if (visitorId) filter.visitorId = visitorId;
    if (customer) filter.customer = customer;
    if (dateFrom || dateTo) {
      filter.occurredAt = {};
      if (dateFrom) filter.occurredAt.$gte = new Date(dateFrom);
      if (dateTo) filter.occurredAt.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Event.find(filter).sort({ occurredAt: -1 }).skip(skip).limit(limit),
      Event.countDocuments(filter),
    ]);
    return { items, total };
  },

  findBySession(sessionId) {
    return Event.find({ sessionId }).sort({ occurredAt: 1 });
  },

  // Right-to-erasure support (Privacy section's "User Data Deletion
  // Ready") - purges every event tied to a visitor or customer identity.
  deleteByVisitor(visitorId) {
    return Event.deleteMany({ visitorId });
  },

  deleteByCustomer(customerId) {
    return Event.deleteMany({ customer: customerId });
  },

  countDistinctSessionsSince(sinceDate) {
    return Event.distinct('sessionId', { occurredAt: { $gte: sinceDate } }).then((rows) => rows.length);
  },
};
