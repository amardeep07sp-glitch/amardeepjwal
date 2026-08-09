import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { getDashboardCards, getDashboardCharts } from './executiveDashboard.controller.js';

const router = Router();
// Surfaces Revenue/Profit/Receivables/Payables - same sensitivity tier as
// Accounting's own Financial Dashboard (Phase 10), PRIVILEGED_ROLES only.
const canView = authorize(...PRIVILEGED_ROLES);

router.get('/cards', protect, canView, getDashboardCards);
router.get('/charts', protect, canView, getDashboardCharts);

export default router;
