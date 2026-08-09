import { ExpenseCategory } from './expenseCategory.model.js';

export const expenseCategoryRepository = {
  findAll(filter = {}) {
    return ExpenseCategory.find(filter).populate({ path: 'defaultAccount', select: 'code name' }).sort({ name: 1 });
  },

  findById(id) {
    return ExpenseCategory.findById(id).populate({ path: 'defaultAccount', select: 'code name' });
  },

  findRawById(id) {
    return ExpenseCategory.findById(id);
  },

  create(data) {
    return ExpenseCategory.create(data);
  },

  async updateById(id, data) {
    const existing = await ExpenseCategory.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return ExpenseCategory.findByIdAndDelete(id);
  },
};
