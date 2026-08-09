import mongoose from 'mongoose';
import { REFERRAL_STATUSES } from './customer.constants.js';

const customerReferralSchema = new mongoose.Schema(
  {
    referrer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    // Unique - a customer can only ever be "the referred one" once, no
    // matter how many referral codes they were shown.
    referredCustomer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true },
    status: { type: String, enum: Object.values(REFERRAL_STATUSES), default: REFERRAL_STATUSES.PENDING, index: true },
    rewardPoints: { type: Number, min: 0, default: 0 },
    rewardedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const CustomerReferral = mongoose.model('CustomerReferral', customerReferralSchema);
