import mongoose from 'mongoose';

const communicationPreferenceSchema = new mongoose.Schema(
  {
    email: { type: Boolean, default: true },
    whatsapp: { type: Boolean, default: true },
    sms: { type: Boolean, default: false },
  },
  { _id: false }
);

// One per customer - upserted, never explicitly "created" by the caller
// (see customerPreference.service.js#getOrCreate).
const customerPreferenceSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true, index: true },
    preferredCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    preferredBrands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
    metalPreference: { type: String, trim: true, default: '' },
    purityPreference: { type: String, trim: true, default: '' },
    budgetMin: { type: Number, min: 0, default: 0 },
    budgetMax: { type: Number, min: 0, default: 0 },
    communicationPreference: { type: communicationPreferenceSchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const CustomerPreference = mongoose.model('CustomerPreference', customerPreferenceSchema);
