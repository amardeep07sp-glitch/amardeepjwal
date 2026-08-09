import mongoose from 'mongoose';

// "Consent Ready" / "Cookie Consent Ready" - one row per visitor identity.
// Absence of a row means "not yet asked" and defaults to tracked (the
// standard web-analytics convention); an explicit false here is always
// honored by event.service.js#trackEvent before anything is persisted.
// Switching this project to a strict opt-in regime later means changing
// event.service.js's one `hasAnalyticsConsent` check, not this schema.
const consentSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, unique: true, index: true },
    analyticsConsent: { type: Boolean, default: true },
    marketingConsent: { type: Boolean, default: true },
    consentedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const ConsentPreference = mongoose.model('ConsentPreference', consentSchema);
