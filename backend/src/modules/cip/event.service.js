import { eventRepository } from './event.repository.js';
import { sessionService } from './session.service.js';
import { visitorService } from './visitor.service.js';
import { consentService } from './consent.service.js';
import { parseUserAgent } from './uaParser.util.js';
import { resolveLocationFromIp, resolveTrafficSource } from './geo.util.js';
import { hashIp } from './ipHash.util.js';
import { EVENT_TYPES, VISITOR_TYPES, FORBIDDEN_METADATA_KEY_PATTERN } from './cip.constants.js';

// "Do not store passwords, OTPs or sensitive payment data" - enforced here,
// once, rather than trusted to every future event producer. Strips any key
// whose NAME looks sensitive, at every nesting level a client could send.
function sanitizeMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return {};
  const clean = {};
  for (const [key, value] of Object.entries(metadata)) {
    if (FORBIDDEN_METADATA_KEY_PATTERN.test(key)) continue; // eslint-disable-line no-continue
    clean[key] = value && typeof value === 'object' && !Array.isArray(value) ? sanitizeMetadata(value) : value;
  }
  return clean;
}

function resolveVisitorType({ customerId, isRegistered }) {
  if (customerId) return VISITOR_TYPES.CUSTOMER;
  if (isRegistered) return VISITOR_TYPES.REGISTERED;
  return VISITOR_TYPES.ANONYMOUS;
}

// ===========================================================================
// THE Event Engine's single ingestion choke-point - every customer action
// the spec names becomes exactly one call here. This is CIP's own front
// door: it never calls into Order/Customer/Inventory/Product to WRITE
// anything (see the module's header comment - "READ-ONLY for business
// data"), only reads a request's IP/User-Agent to enrich the event it's
// about to store in CIP's own collections. Every other CIP write
// (Visitor.touch, Session.getOrCreateSession) is also funneled through
// here, not called independently by controllers - a controller only ever
// calls trackEvent().
// ===========================================================================
export const eventService = {
  async trackEvent(payload, requestContext = {}) {
    const {
      eventType,
      sessionId,
      visitorId,
      customerId = null,
      isRegistered = false,
      page = '',
      pageType = '',
      metadata = {},
      screenResolution = '',
      language = '',
      timezone = '',
      network = '',
      referrer = '',
      utmSource = '',
      utmMedium = '',
      utmCampaign = '',
      utmTerm = '',
      utmContent = '',
      landingPage = '',
    } = payload;

    if (!Object.values(EVENT_TYPES).includes(eventType)) return null;

    // Consent Ready - an explicit opt-out is honored; no recorded
    // preference yet defaults to tracked, the standard web-analytics
    // convention (see consent.service.js's header comment for the
    // stricter opt-in alternative this can be swapped to later).
    const hasConsent = await consentService.hasAnalyticsConsent(visitorId);
    if (!hasConsent) return null;

    const { type, browser, os } = parseUserAgent(requestContext.userAgent);
    const location = await resolveLocationFromIp(requestContext.ip);
    location.ipHash = hashIp(requestContext.ip);

    const device = { type, browser, os, screenResolution, language, timezone, network };
    const traffic = { source: resolveTrafficSource({ utmSource, referrer }), referrer, utmSource, utmMedium, utmCampaign, utmTerm, utmContent, landingPage };
    const visitorType = resolveVisitorType({ customerId, isRegistered });

    await visitorService.touch(visitorId, { device, location });

    await sessionService.getOrCreateSession({
      sessionId,
      visitorId,
      customer: customerId,
      visitorType,
      device,
      location,
      traffic,
      isPageView: eventType === EVENT_TYPES.PAGE_VIEW,
    });

    if (eventType === EVENT_TYPES.LOGIN && customerId) {
      await visitorService.linkCustomer(visitorId, customerId);
      await sessionService.recordLogin(sessionId, customerId, visitorType);
    }
    if (eventType === EVENT_TYPES.LOGOUT) {
      await sessionService.recordLogout(sessionId);
      await sessionService.closeSession(sessionId);
    }
    if (eventType === EVENT_TYPES.ORDER_PLACED && metadata.isGuestCheckout) {
      await visitorService.markGuestCheckout(visitorId);
    }

    return eventRepository.create({
      eventType,
      sessionId,
      visitorId,
      customer: customerId,
      visitorType,
      page,
      pageType,
      device,
      location,
      traffic,
      metadata: sanitizeMetadata(metadata),
      occurredAt: new Date(),
    });
  },

  listEvents(query) {
    return eventRepository.findPaginated(query);
  },

  getSessionJourney(sessionId) {
    return eventRepository.findBySession(sessionId);
  },
};
