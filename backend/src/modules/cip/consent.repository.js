import { ConsentPreference } from './consent.model.js';

export const consentRepository = {
  findByVisitorId(visitorId) {
    return ConsentPreference.findOne({ visitorId });
  },

  upsert(visitorId, { analyticsConsent, marketingConsent }) {
    return ConsentPreference.findOneAndUpdate(
      { visitorId },
      { $set: { analyticsConsent, marketingConsent, consentedAt: new Date() } },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );
  },

  deleteByVisitorId(visitorId) {
    return ConsentPreference.deleteOne({ visitorId });
  },
};
