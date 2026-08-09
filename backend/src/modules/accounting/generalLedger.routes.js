import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { accountLedgerQuerySchema, trialBalanceQuerySchema } from './generalLedger.validation.js';
import { getAccountLedger, getTrialBalance } from './generalLedger.controller.js';

const router = Router();
const canView = authorize(...PRIVILEGED_ROLES);

router.get('/trial-balance', protect, canView, validate(trialBalanceQuerySchema), getTrialBalance);
router.get('/account/:accountId', protect, canView, validate(accountLedgerQuerySchema), getAccountLedger);

export default router;
