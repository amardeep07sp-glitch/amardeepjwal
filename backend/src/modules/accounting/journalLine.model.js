import mongoose from 'mongoose';
import { PARTY_TYPES } from './accounting.constants.js';

// One party dimension per line - lets Receivables/Payables aging
// (receivables.service.js / payables.service.js) filter Accounts
// Receivable/Payable lines by the specific customer/supplier they belong
// to, without needing a second collection. null/null for every line that
// isn't AR/AP-facing (Cash, Revenue, Expense, etc.).
const partySchema = new mongoose.Schema(
  {
    type: { type: String, enum: Object.values(PARTY_TYPES), default: null },
    id: { type: mongoose.Schema.Types.ObjectId, default: null },
  },
  { _id: false }
);

// Immutable, append-only - one row per account touched by a Journal. Never
// updated or deleted by anything; see journal.model.js's header comment.
const journalLineSchema = new mongoose.Schema(
  {
    journal: { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', required: true, index: true },
    account: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', required: true, index: true },
    debit: { type: Number, default: 0, min: 0 },
    credit: { type: Number, default: 0, min: 0 },
    party: { type: partySchema, default: () => ({ type: null, id: null }) },
    narration: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

journalLineSchema.index({ account: 1, date: 1 });
journalLineSchema.index({ 'party.type': 1, 'party.id': 1 });

export const JournalLine = mongoose.model('JournalLine', journalLineSchema);
