import { eventRepository } from './event.repository.js';
import { sessionRepository } from './session.repository.js';
import { visitorRepository } from './visitor.repository.js';
import { consentRepository } from './consent.repository.js';

// "User Data Deletion Ready" (Privacy section) - a real right-to-erasure
// implementation, not just a documented intent. Purges every CIP-owned
// collection tied to an identity; never touches Order/Customer/CRM (this
// module has no write access to those, and erasing analytics history is
// not the same request as erasing a business record).
export const privacyService = {
  async deleteVisitorData(visitorId) {
    const [events, sessions, visitor, consent] = await Promise.all([
      eventRepository.deleteByVisitor(visitorId),
      sessionRepository.deleteByVisitor(visitorId),
      visitorRepository.deleteByVisitorId(visitorId),
      consentRepository.deleteByVisitorId(visitorId),
    ]);
    return {
      eventsDeleted: events.deletedCount,
      sessionsDeleted: sessions.deletedCount,
      visitorDeleted: visitor.deletedCount,
      consentDeleted: consent.deletedCount,
    };
  },

  // Admin-triggered - erases every analytics record CIP ever linked to a
  // specific Customer (once they're identified, e.g. via a data-subject
  // access/erasure request), independent of which anonymous visitorId(s)
  // they browsed under.
  async deleteCustomerData(customerId) {
    const [events, sessions, visitors] = await Promise.all([
      eventRepository.deleteByCustomer(customerId),
      sessionRepository.deleteByCustomer(customerId),
      visitorRepository.deleteByCustomer(customerId),
    ]);
    return {
      eventsDeleted: events.deletedCount,
      sessionsDeleted: sessions.deletedCount,
      visitorsDeleted: visitors.deletedCount,
    };
  },
};
