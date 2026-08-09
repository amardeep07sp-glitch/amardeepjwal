import { ApiError } from '../../utils/ApiError.js';
import { expenseCategoryRepository } from './expenseCategory.repository.js';

export const expenseCategoryService = {
  listCategories(filter) {
    return expenseCategoryRepository.findAll(filter);
  },

  async getCategoryById(id) {
    const category = await expenseCategoryRepository.findById(id);
    if (!category) throw new ApiError(404, 'Expense category not found');
    return category;
  },

  createCategory(data) {
    return expenseCategoryRepository.create(data);
  },

  async updateCategory(id, data) {
    const category = await expenseCategoryRepository.updateById(id, data);
    if (!category) throw new ApiError(404, 'Expense category not found');
    return category;
  },

  async deleteCategory(id) {
    const deleted = await expenseCategoryRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Expense category not found');
  },
};
