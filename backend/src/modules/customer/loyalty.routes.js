import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import { loyaltyTransactionSchema, customerIdParamSchema, loyaltyLedgerQuerySchema } from './loyalty.validation.js';
import { getLoyalty, getLoyaltyLedger, recordLoyaltyTransaction } from './loyalty.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/:customerId', protect, canView, validate(customerIdParamSchema), getLoyalty);
router.get('/:customerId/ledger', protect, canView, validate(loyaltyLedgerQuerySchema), getLoyaltyLedger);
router.post('/:customerId/transactions', protect, canManage, validate(loyaltyTransactionSchema), recordLoyaltyTransaction);

export default router;
