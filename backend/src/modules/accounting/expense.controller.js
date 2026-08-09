import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { expenseService } from './expense.service.js';
import { serializeExpense, serializeExpenseList } from './expense.serializer.js';

export const listExpenses = asyncHandler(async (req, res) => {
  const result = await expenseService.listExpenses(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeExpenseList(result.items), meta: result.meta }, 'Expenses fetched successfully'));
});

export const getExpenseById = asyncHandler(async (req, res) => {
  const expense = await expenseService.getExpenseById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeExpense(expense), 'Expense fetched successfully'));
});

export const createExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.createExpense(req.body, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeExpense(expense), 'Expense submitted successfully'));
});

export const approveExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.approveExpense(req.params.id, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeExpense(expense), 'Expense approved and posted successfully'));
});

export const rejectExpense = asyncHandler(async (req, res) => {
  const expense = await expenseService.rejectExpense(req.params.id, req.user._id, req.body.reason);
  res.status(200).json(new ApiResponse(200, serializeExpense(expense), 'Expense rejected'));
});
