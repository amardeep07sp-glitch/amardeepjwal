import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { expenseRepository } from './expense.repository.js';
import { expenseCategoryRepository } from './expenseCategory.repository.js';
import { accountingEvents } from './accountingEvents.service.js';
import { EXPENSE_STATUSES } from './accounting.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const expenseService = {
  async listExpenses(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await expenseRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getExpenseById(id) {
    const expense = await expenseRepository.findById(id);
    if (!expense) throw new ApiError(404, 'Expense not found');
    return expense;
  },

  // Submission alone never touches the books - "Approval Ready" per the
  // spec means a journal is only ever posted once a privileged approver
  // signs off, exactly like Order Return's requested->approved gate.
  createExpense(data, userId) {
    return expenseRepository.create({ ...data, status: EXPENSE_STATUSES.PENDING, submittedBy: userId });
  },

  // The one step that actually touches the books - resolves the expense's
  // category default account (falling back to General Operating Expenses
  // inside accountingEvents.recordExpense when none is set) and posts the
  // journal in the same transaction as the status change.
  async approveExpense(id, userId) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const expense = await expenseRepository.findRawById(id, session);
      if (!expense) throw new ApiError(404, 'Expense not found');
      if (expense.status !== EXPENSE_STATUSES.PENDING) {
        throw new ApiError(400, `Expense is already ${expense.status}`);
      }

      const category = await expenseCategoryRepository.findRawById(expense.category);

      const journal = await accountingEvents.recordExpense(
        {
          expenseId: expense._id,
          accountId: category?.defaultAccount ?? null,
          method: expense.method,
          amount: expense.amount,
          description: expense.description || category?.name,
          performedBy: userId,
        },
        session
      );

      expense.status = EXPENSE_STATUSES.APPROVED;
      expense.approvedBy = userId;
      expense.journal = journal._id;
      await expense.save({ session });

      await session.commitTransaction();
      return expenseRepository.findById(id);
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  async rejectExpense(id, userId, reason) {
    const expense = await expenseRepository.findRawById(id);
    if (!expense) throw new ApiError(404, 'Expense not found');
    if (expense.status !== EXPENSE_STATUSES.PENDING) {
      throw new ApiError(400, `Expense is already ${expense.status}`);
    }

    await expenseRepository.updateById(id, { status: EXPENSE_STATUSES.REJECTED, approvedBy: userId, rejectionReason: reason || '' });
    return expenseRepository.findById(id);
  },
};
