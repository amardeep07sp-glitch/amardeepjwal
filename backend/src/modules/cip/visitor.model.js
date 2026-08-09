import mongoose from 'mongoose';
import { deviceSchema, locationSchema } from './cip.schemas.js';

// One row per anonymous browser/device identity (visitorId is a UUID the
// tracking SDK generates and persists client-side, e.g. in localStorage) -
// tracked across every visit, whether or not they ever log in. `customer`
// is set once/if this visitor authenticates; the identity itself (visitorId)
// never changes, so pre-login and post-login activity stays one continuous
// record - "Returning Visitor" is answered by this collection's own
// firstSeenAt, not recomputed from Event on every query.
const visitorSchema = new mongoose.Schema(
  {
    visitorId: { type: String, required: true, unique: true, index: true },
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', default: null, index: true },
    firstSeenAt: { type: Date, default: Date.now },
    lastSeenAt: { type: Date, default: Date.now },
    sessionCount: { type: Number, default: 0 },
    isGuestCheckout: { type: Boolean, default: false },
    lastDevice: { type: deviceSchema, default: () => ({}) },
    lastLocation: { type: locationSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Visitor = mongoose.model('Visitor', visitorSchema);
