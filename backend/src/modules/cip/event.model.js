import mongoose from 'mongoose';
import { env } from '../../config/env.js';
import { EVENT_TYPES, VISITOR_TYPES } from './cip.constants.js';
import { deviceSchema, locationSchema, trafficSchema } from './cip.schemas.js';

// THE Event Engine's single collection - every customer action in the
// spec's list becomes one document here. Read-only from every other
// module's perspective; this collection is CIP's own, nothing else writes
// to it and it never writes to anything else (see event.service.js's
// header comment).
const eventSchema = new mongoose.Schema(
  {
    eventType: { type: String, enum: Object.values(EVENT_TYPES), required: true, index: true },
    sessionId: { type: String, required: true, index: true },
    visitorId: { type: String, required: true, index: true },
    // Nullable - most events happen before/without a login. Set once a
    // visitor is known to be a specific Customer (never written back onto
    // Customer itself - see customer.model.js, untouched by this module).
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
    visitorType: { type: String, enum: Object.values(VISITOR_TYPES), default: VISITOR_TYPES.ANONYMOUS },

    page: { type: String, trim: true, default: '' },
    // Drives Funnel Analytics' "Homepage" step (see cip.constants.js's
    // FUNNEL_STEPS) - the one place a page_view needs to say more than
    // just its URL.
    pageType: { type: String, trim: true, default: '' },

    device: { type: deviceSchema, default: () => ({}) },
    location: { type: locationSchema, default: () => ({}) },
    traffic: { type: trafficSchema, default: () => ({}) },

    // Event-specific payload (e.g. { productId, searchQuery, cartValue }) -
    // sanitized by event.service.js#sanitizeMetadata before this document
    // is ever created; FORBIDDEN_METADATA_KEY_PATTERN keys never reach here.
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },

    occurredAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// Data Retention Policy - TTL-expires raw events after
// CIP_EVENT_RETENTION_DAYS (default 180). Aggregation reports read within
// this window; nothing in this module assumes events live forever.
eventSchema.index({ occurredAt: 1 }, { expireAfterSeconds: env.CIP_EVENT_RETENTION_DAYS * 24 * 60 * 60 });
eventSchema.index({ eventType: 1, occurredAt: -1 });
eventSchema.index({ sessionId: 1, occurredAt: 1 });
eventSchema.index({ visitorId: 1, occurredAt: -1 });
eventSchema.index({ customer: 1, occurredAt: -1 });
eventSchema.index({ 'traffic.utmCampaign': 1 });
eventSchema.index({ 'metadata.productId': 1 });
eventSchema.index({ 'metadata.categoryId': 1 });

export const Event = mongoose.model('Event', eventSchema);
