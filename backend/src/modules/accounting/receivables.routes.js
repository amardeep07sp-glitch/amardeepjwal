import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { getOutstanding, getAgingReport, getCustomerLedger } from './receivables.controller.js';

const router = Router();
const canView = authorize(...PRIVILEGED_ROLES);

router.get('/outstanding', protect, canView, getOutstanding);
router.get('/aging', protect, canView, getAgingReport);
router.get('/customer/:customerId', protect, canView, getCustomerLedger);

export default router;
