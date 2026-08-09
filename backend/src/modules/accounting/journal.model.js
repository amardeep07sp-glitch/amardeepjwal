import mongoose from 'mongoose';
import { ACCOUNTING_EVENT_TYPES, JOURNAL_STATUSES } from './accounting.constants.js';

// THE double-entry journal header - immutable once posted (see
// journal.service.js#postJournal). A correction never edits this document's
// financial content; it only ever gets a new `status` marker once a
// corresponding reversing entry exists (journal.service.js#reverseJournal) -
// the debit/credit amounts recorded here are permanent history.
const journalSchema = new mongoose.Schema(
  {
    journalNumber: { type: String, required: true, unique: true, index: true },
    date: { type: Date, required: true, default: Date.now, index: true },
    eventType: { type: String, enum: Object.values(ACCOUNTING_EVENT_TYPES), required: true, index: true },
    // What business record this journal explains - an Order, PurchaseOrder,
    // Expense, etc. Never a hard Mongoose ref (referenceType varies), same
    // "polymorphic reference" convention as InventoryMovement/SupplierLedger.
    referenceType: { type: String, trim: true, default: '', index: true },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null, index: true },
    narration: { type: String, trim: true, default: '' },
    status: { type: String, enum: Object.values(JOURNAL_STATUSES), default: JOURNAL_STATUSES.POSTED, index: true },
    // Set on the NEW reversing journal, pointing back at the journal it
    // reverses - never set on the original (see reverseJournal).
    reversalOf: { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', default: null },
    totalAmount: { type: Number, required: true, min: 0 },
    postedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    postedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

journalSchema.index({ createdAt: -1 });
journalSchema.index({ referenceType: 1, referenceId: 1 });

export const Journal = mongoose.model('Journal', journalSchema);
