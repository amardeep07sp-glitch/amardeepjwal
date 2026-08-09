import mongoose from 'mongoose';

// Optionally maps to a specific Expense-type Account - if unset, expenses
// in this category post against the generic "General Operating Expenses"
// system account instead (see expense.service.js#approveExpense).
const expenseCategorySchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true, trim: true },
    defaultAccount: { type: mongoose.Schema.Types.ObjectId, ref: 'Account', default: null },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const ExpenseCategory = mongoose.model('ExpenseCategory', expenseCategorySchema);
