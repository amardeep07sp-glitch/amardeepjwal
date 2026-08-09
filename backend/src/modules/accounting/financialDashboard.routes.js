import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { getDashboardTotals, getIncomeVsExpenseTrend, getCashFlowTrend, getProfitTrend } from './financialDashboard.controller.js';

const router = Router();
const canView = authorize(...PRIVILEGED_ROLES);

router.get('/totals', protect, canView, getDashboardTotals);
router.get('/income-vs-expense', protect, canView, getIncomeVsExpenseTrend);
router.get('/cash-flow', protect, canView, getCashFlowTrend);
router.get('/profit-trend', protect, canView, getProfitTrend);

export default router;
