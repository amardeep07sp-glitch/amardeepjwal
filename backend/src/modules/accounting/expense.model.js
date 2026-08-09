import mongoose from 'mongoose';
import { EXPENSE_STATUSES, EXPENSE_PAYMENT_METHODS } from './accounting.constants.js';

const expenseSchema = new mongoose.Schema(
  {
    category: { type: mongoose.Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true, index: true },
    amount: { type: Number, required: true, min: 0 },
    description: { type: String, trim: true, default: '' },
    date: { type: Date, required: true, default: Date.now },
    method: { type: String, enum: Object.values(EXPENSE_PAYMENT_METHODS), default: EXPENSE_PAYMENT_METHODS.CASH },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],

    status: { type: String, enum: Object.values(EXPENSE_STATUSES), default: EXPENSE_STATUSES.PENDING, index: true },
    // Set only once approveExpense has actually posted the journal - the
    // one place an Expense document links to its financial effect.
    journal: { type: mongoose.Schema.Types.ObjectId, ref: 'Journal', default: null },

    submittedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    rejectionReason: { type: String, trim: true, default: '' },
  },
  { timestamps: true }
);

expenseSchema.index({ date: -1 });

export const Expense = mongoose.model('Expense', expenseSchema);
