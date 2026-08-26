import mongoose from 'mongoose';

// The 4 rate fields this module tracks - shared with metalRate.repository.js
// (to know which fields to snapshot as "previous" on change) and
// metalRate.serializer.js (to compute the up/down trend per field), so
// adding a metal here is the only place that needs to change.
export const METAL_FIELDS = ['gold24k', 'gold22k', 'gold18k', 'silver'];

// Singleton, same pattern as Settings (settings.model.js) - one document,
// found-or-created on first read. Staff manually key in "today's rate"
// (there is no live market-data feed wired into this system), same
// real-world workflow most jewellery retailers already follow - rates get
// checked against a source once and typed in, not scraped.
const metalRateSchema = new mongoose.Schema(
  {
    gold24k: { type: Number, min: 0, default: 0 },
    gold22k: { type: Number, min: 0, default: 0 },
    gold18k: { type: Number, min: 0, default: 0 },
    silver: { type: Number, min: 0, default: 0 },
    // Snapshot of each field's value right before its last change - lets the
    // storefront show an up/down trend arrow without a full rate-history
    // collection. Only ever updated by updateSingleton() when a field
    // actually changes value, never by every save.
    previousGold24k: { type: Number, min: 0, default: 0 },
    previousGold22k: { type: Number, min: 0, default: 0 },
    previousGold18k: { type: Number, min: 0, default: 0 },
    previousSilver: { type: Number, min: 0, default: 0 },
    unit: { type: String, trim: true, default: 'per gram' },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const MetalRate = mongoose.model('MetalRate', metalRateSchema);
