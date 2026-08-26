import mongoose from 'mongoose';

// One row per login where the visitor actually granted the browser
// geolocation permission prompt (client/src/store/authStore.js's
// login()) - real GPS-derived city/state/country, never the raw lat/lng
// (see geo.util.js#resolveLocationFromCoords, the only writer of this
// collection). A login where permission was denied/unavailable simply
// never creates a row here - never a fabricated/IP-guessed fallback row.
const loginLocationSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    country: { type: String, trim: true, default: '' },
    state: { type: String, trim: true, default: '', index: true },
    city: { type: String, trim: true, default: '' },
    approxLat: { type: Number, default: null },
    approxLng: { type: Number, default: null },
  },
  { timestamps: true }
);

loginLocationSchema.index({ createdAt: -1 });

export const LoginLocation = mongoose.model('LoginLocation', loginLocationSchema);
