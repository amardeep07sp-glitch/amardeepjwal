import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { createExpenseSchema, expenseIdSchema, rejectExpenseSchema, listExpensesQuerySchema } from './expense.validation.js';
import { listExpenses, getExpenseById, createExpense, approveExpense, rejectExpense } from './expense.controller.js';

const router = Router();
// Staff/Managers submit expenses they incur - only PRIVILEGED_ROLES may
// approve/reject (the step that actually posts a journal), per the spec's
// "Approval Ready" + "Only privileged roles: Post Journal".
const canSubmit = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);
const canApprove = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canApprove, validate(listExpensesQuerySchema), listExpenses);
router.post('/', protect, canSubmit, validate(createExpenseSchema), createExpense);
router.get('/:id', protect, canApprove, validate(expenseIdSchema), getExpenseById);
router.patch('/:id/approve', protect, canApprove, validate(expenseIdSchema), approveExpense);
router.patch('/:id/reject', protect, canApprove, validate(rejectExpenseSchema), rejectExpense);

export default router;
