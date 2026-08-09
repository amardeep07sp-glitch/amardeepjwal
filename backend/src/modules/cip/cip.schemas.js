import mongoose from 'mongoose';
import { DEVICE_TYPES, TRAFFIC_SOURCES } from './cip.constants.js';

// Shared embedded sub-schemas - Event and Session both capture the same
// device/location/traffic shape (Session once, at start; Event on every
// single hit), defined once here so neither model redefines it.

export const deviceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(DEVICE_TYPES), default: DEVICE_TYPES.UNKNOWN },
    browser: { type: String, trim: true, default: '' },
    os: { type: String, trim: true, default: '' },
    screenResolution: { type: String, trim: true, default: '' },
    language: { type: String, trim: true, default: '' },
    timezone: { type: String, trim: true, default: '' },
    network: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// "Never store precise GPS" - approxLat/approxLng are city-centroid-level
// (whatever a geo-IP lookup returns), never a browser Geolocation API
// reading. ipHash is a one-way SHA-256 truncation (see ipHash.util.js) -
// the raw IP address itself is never persisted, satisfying "IP Masking
// Ready" by construction rather than as an optional toggle.
export const locationSchema = new mongoose.Schema(
  {
    country: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '' },
    city: { type: String, trim: true, default: '' },
    approxLat: { type: Number, default: null },
    approxLng: { type: Number, default: null },
    timezone: { type: String, trim: true, default: '' },
    ipHash: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

export const trafficSchema = new mongoose.Schema(
  {
    source: { type: String, enum: Object.values(TRAFFIC_SOURCES), default: TRAFFIC_SOURCES.DIRECT },
    referrer: { type: String, trim: true, default: '' },
    utmSource: { type: String, trim: true, default: '' },
    utmMedium: { type: String, trim: true, default: '' },
    utmCampaign: { type: String, trim: true, default: '' },
    utmTerm: { type: String, trim: true, default: '' },
    utmContent: { type: String, trim: true, default: '' },
    landingPage: { type: String, trim: true, default: '' },
  },
  { _id: false }
);
