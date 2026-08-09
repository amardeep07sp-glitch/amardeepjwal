import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createExpenseCategorySchema, updateExpenseCategorySchema, expenseCategoryIdSchema } from './expenseCategory.validation.js';
import { listExpenseCategories, createExpenseCategory, updateExpenseCategory, deleteExpenseCategory } from './expenseCategory.controller.js';

const router = Router();
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canManage, listExpenseCategories);
router.post('/', protect, canManage, validate(createExpenseCategorySchema), createExpenseCategory);
router.put('/:id', protect, canManage, validate(updateExpenseCategorySchema), updateExpenseCategory);
router.delete('/:id', protect, canManage, validate(expenseCategoryIdSchema), deleteExpenseCategory);

export default router;
