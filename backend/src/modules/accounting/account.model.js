import mongoose from 'mongoose';
import { ACCOUNT_TYPES } from './accounting.constants.js';

// THE Chart of Accounts entity. `currentBalance` is a denormalized cache -
// mutated ONLY by journal.service.js#postJournal (and its reversal) inside
// the same transaction as the JournalLine that explains the change, the
// exact single-choke-point discipline every ledger in this codebase follows
// (InventoryMovement, WalletLedger, SupplierLedger). JournalLine remains the
// immutable historical source of truth - currentBalance can always be
// recomputed from it (see generalLedger.service.js) if the two ever needed
// reconciling.
const accountSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, trim: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, enum: Object.values(ACCOUNT_TYPES), required: true, index: true },
    parent: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null, index: true },
    description: { type: String, trim: true, default: '' },

    openingBalance: { type: Number, default: 0 },
    currentBalance: { type: Number, default: 0 },

    // System accounts (seeded by account.seed.js, looked up by code from
    // accountingEvents.service.js) can never be deleted or have their code
    // changed - see account.service.js#updateAccount/#deleteAccount.
    isSystem: { type: Boolean, default: false },
    active: { type: Boolean, default: true, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

accountSchema.index({ type: 1, active: 1 });

export const Account = mongoose.model('Account', accountSchema);
