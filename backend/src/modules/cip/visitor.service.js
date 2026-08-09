import { visitorRepository } from './visitor.repository.js';

export const visitorService = {
  touch(visitorId, context) {
    return visitorRepository.touch(visitorId, context);
  },

  linkCustomer(visitorId, customerId) {
    return visitorRepository.linkCustomer(visitorId, customerId);
  },

  markGuestCheckout(visitorId) {
    return visitorRepository.markGuestCheckout(visitorId);
  },

  // Called once per NEW session (session.service.js#startSession) - a
  // visitor is "returning" the moment they start their second-ever
  // session, which is exactly what sessionCount captures.
  async recordNewSession(visitorId) {
    const visitor = await visitorRepository.incrementSessionCount(visitorId);
    return { isReturning: (visitor?.sessionCount ?? 1) > 1 };
  },

  listVisitors(query) {
    return visitorRepository.findPaginated(query);
  },

  getVisitor(visitorId) {
    return visitorRepository.findByVisitorId(visitorId);
  },

  // Privacy - "User Data Deletion Ready".
  async deleteVisitorData(visitorId) {
    await visitorRepository.deleteByVisitorId(visitorId);
  },
};
