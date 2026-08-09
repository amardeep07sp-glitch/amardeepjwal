import mongoose from 'mongoose';
import { WALLET_TXN_TYPES } from './customer.constants.js';

// Append-only - no update/delete repository methods, same structural
// immutability convention as InventoryMovement/OrderTimeline.
const walletLedgerSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    type: { type: String, enum: Object.values(WALLET_TXN_TYPES), required: true },
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, trim: true, default: '' },
    referenceType: { type: String, trim: true, default: '' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

walletLedgerSchema.index({ customer: 1, createdAt: -1 });

export const WalletLedger = mongoose.model('WalletLedger', walletLedgerSchema);
