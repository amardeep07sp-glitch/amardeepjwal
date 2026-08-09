import { consentRepository } from './consent.repository.js';

export const consentService = {
  // No recorded preference = tracked by default (see consent.model.js's
  // header comment) - only an explicit false ever suppresses tracking.
  async hasAnalyticsConsent(visitorId) {
    const preference = await consentRepository.findByVisitorId(visitorId);
    return preference ? preference.analyticsConsent : true;
  },

  setConsent(visitorId, preferences) {
    return consentRepository.upsert(visitorId, preferences);
  },

  getConsent(visitorId) {
    return consentRepository.findByVisitorId(visitorId);
  },
};
