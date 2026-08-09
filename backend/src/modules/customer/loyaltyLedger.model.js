import mongoose from 'mongoose';
import { LOYALTY_TXN_TYPES } from './customer.constants.js';

// Append-only - same structural immutability convention as WalletLedger/
// InventoryMovement/OrderTimeline.
const loyaltyLedgerSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: Object.values(LOYALTY_TXN_TYPES), required: true },
    points: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, trim: true, default: '' },
    referenceType: { type: String, trim: true, default: '' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    expiresAt: { type: Date, default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

loyaltyLedgerSchema.index({ customer: 1, createdAt: -1 });

export const LoyaltyLedger = mongoose.model('LoyaltyLedger', loyaltyLedgerSchema);
