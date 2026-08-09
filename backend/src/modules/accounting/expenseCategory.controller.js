import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { expenseCategoryService } from './expenseCategory.service.js';
import { serializeExpenseCategory, serializeExpenseCategoryList } from './expenseCategory.serializer.js';

export const listExpenseCategories = asyncHandler(async (req, res) => {
  const categories = await expenseCategoryService.listCategories();
  res.status(200).json(new ApiResponse(200, serializeExpenseCategoryList(categories), 'Expense categories fetched successfully'));
});

export const createExpenseCategory = asyncHandler(async (req, res) => {
  const category = await expenseCategoryService.createCategory(req.body);
  res.status(201).json(new ApiResponse(201, serializeExpenseCategory(category), 'Expense category created successfully'));
});

export const updateExpenseCategory = asyncHandler(async (req, res) => {
  const category = await expenseCategoryService.updateCategory(req.params.id, req.body);
  res.status(200).json(new ApiResponse(200, serializeExpenseCategory(category), 'Expense category updated successfully'));
});

export const deleteExpenseCategory = asyncHandler(async (req, res) => {
  await expenseCategoryService.deleteCategory(req.params.id);
  res.status(200).json(new ApiResponse(200, null, 'Expense category deleted successfully'));
});
