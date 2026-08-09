import mongoose from 'mongoose';
import { VISITOR_TYPES } from './cip.constants.js';
import { deviceSchema, locationSchema, trafficSchema } from './cip.schemas.js';

// One row per browsing session (sessionId is a UUID the tracking SDK mints
// per tab/visit and holds only in memory - never persisted client-side the
// way visitorId is, so a new tab or a return after the idle timeout is
// genuinely a new session). Device/location/traffic are captured ONCE here,
// at session start, as a stable snapshot - Event captures them on every hit
// because a session can technically span network changes, but the Session
// Report always wants "what was true when this session began".
const sessionSchema = new mongoose.Schema(
  {
    sessionId: { type: String, required: true, unique: true, index: true },
    visitorId: { type: String, required: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
    visitorType: { type: String, enum: Object.values(VISITOR_TYPES), default: VISITOR_TYPES.ANONYMOUS },

    startTime: { type: Date, default: Date.now },
    lastActivityAt: { type: Date, default: Date.now, index: true },
    endTime: { type: Date, default: null, index: true },
    loginTime: { type: Date, default: null },
    logoutTime: { type: Date, default: null },

    // Set only once closeSession runs (see session.service.js) - null/0
    // while the session is still open.
    durationSeconds: { type: Number, default: 0 },
    idleSeconds: { type: Number, default: 0 },
    isBounce: { type: Boolean, default: false },
    isReturning: { type: Boolean, default: false },

    pageViewCount: { type: Number, default: 0 },
    eventCount: { type: Number, default: 0 },

    device: { type: deviceSchema, default: () => ({}) },
    location: { type: locationSchema, default: () => ({}) },
    traffic: { type: trafficSchema, default: () => ({}) },
  },
  { timestamps: true }
);

sessionSchema.index({ endTime: 1, lastActivityAt: 1 });

export const Session = mongoose.model('Session', sessionSchema);
