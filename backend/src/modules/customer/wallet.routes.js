import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import { walletTransactionSchema, customerIdParamSchema, walletLedgerQuerySchema } from './wallet.validation.js';
import { getWallet, getWalletLedger, recordWalletTransaction } from './wallet.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Real money - kept to PRIVILEGED_ROLES only, same restriction tier as
// Order's Refund.
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/:customerId', protect, canView, validate(customerIdParamSchema), getWallet);
router.get('/:customerId/ledger', protect, canView, validate(walletLedgerQuerySchema), getWalletLedger);
router.post('/:customerId/transactions', protect, canManage, validate(walletTransactionSchema), recordWalletTransaction);

export default router;
