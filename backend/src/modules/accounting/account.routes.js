import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createAccountSchema, updateAccountSchema, accountIdSchema, listAccountsQuerySchema } from './account.validation.js';
import { listAccounts, listAllAccounts, getAccountById, createAccount, updateAccount, deleteAccount } from './account.controller.js';

const router = Router();
// Accounting is a financial-control surface, not a general operations one -
// PRIVILEGED_ROLES only throughout, per the Phase 10 spec's explicit RBAC
// section ("Only privileged roles: Create Journal, Post Journal, Reverse
// Journal, View Financial Reports"). No STAFF/VIEWER tier here, unlike
// Order/Customer/Supplier management.
const canView = authorize(...PRIVILEGED_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listAccountsQuerySchema), listAccounts);
router.get('/all', protect, canView, listAllAccounts);
router.post('/', protect, canManage, validate(createAccountSchema), createAccount);

router.get('/:id', protect, canView, validate(accountIdSchema), getAccountById);
router.put('/:id', protect, canManage, validate(updateAccountSchema), updateAccount);
router.delete('/:id', protect, canManage, validate(accountIdSchema), deleteAccount);

export default router;
