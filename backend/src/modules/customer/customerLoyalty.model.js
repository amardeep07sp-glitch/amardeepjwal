import mongoose from 'mongoose';
import { LOYALTY_TIERS } from './customer.constants.js';

// One per customer - currentPoints is NEVER written directly (see
// loyalty.service.js#recordTransaction, the single choke-point). Auto
// -provisioned at zero points when a Customer is created.
const customerLoyaltySchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true, index: true },
    currentPoints: { type: Number, default: 0, min: 0 },
    lifetimePointsEarned: { type: Number, default: 0, min: 0 },
    currentTier: { type: String, enum: Object.values(LOYALTY_TIERS), default: LOYALTY_TIERS.SILVER },
  },
  { timestamps: true }
);

export const CustomerLoyalty = mongoose.model('CustomerLoyalty', customerLoyaltySchema);
