import mongoose from 'mongoose';

export const PRICE_ADJUSTMENT_TYPES = Object.freeze({
  PERCENTAGE: 'percentage',
  FIXED: 'fixed',
});

export const PRICE_STATUSES = Object.freeze({
  ACTIVE: 'active',
  INACTIVE: 'inactive',
});

// Embedded on Product. Kept schema-stable on purpose - new business rules
// (e.g. a real gold-rate formula) should change what priceCalculator.js does
// with these fields, not require adding new fields/migrations.
export const pricingSchema = new mongoose.Schema(
  {
    costPrice: { type: Number, min: 0, default: 0 },
    sellingPrice: { type: Number, min: 0, default: 0 },
    mrp: { type: Number, min: 0, default: 0 },
    discountType: {
      type: String,
      enum: Object.values(PRICE_ADJUSTMENT_TYPES),
      default: PRICE_ADJUSTMENT_TYPES.PERCENTAGE,
    },
    discountValue: { type: Number, min: 0, default: 0 },
    finalPrice: { type: Number, min: 0, default: 0 },
    taxIncluded: { type: Boolean, default: false },
    taxPercentage: { type: Number, min: 0, max: 100, default: 0 },
    currency: { type: String, trim: true, default: 'INR' },
    priceStatus: { type: String, enum: Object.values(PRICE_STATUSES), default: PRICE_STATUSES.ACTIVE },

    // Jewellery-specific fields, captured for a future pricing formula.
    // Not yet part of the finalPrice calculation - see priceCalculator.js.
    makingCharges: { type: Number, min: 0, default: 0 },
    makingChargeType: {
      type: String,
      enum: Object.values(PRICE_ADJUSTMENT_TYPES),
      default: PRICE_ADJUSTMENT_TYPES.FIXED,
    },
    wastagePercentage: { type: Number, min: 0, default: 0 },
    goldRateSnapshot: { type: Number, min: 0, default: 0 },
    silverRateSnapshot: { type: Number, min: 0, default: 0 },
    stoneCost: { type: Number, min: 0, default: 0 },
    diamondCost: { type: Number, min: 0, default: 0 },
    labourCost: { type: Number, min: 0, default: 0 },
  },
  { _id: false }
);
