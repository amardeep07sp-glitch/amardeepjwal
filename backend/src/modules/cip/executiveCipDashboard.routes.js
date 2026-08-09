import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { getDashboardCards, getDashboardWidgets } from './executiveCipDashboard.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/cards', protect, canView, getDashboardCards);
router.get('/widgets', protect, canView, getDashboardWidgets);

export default router;
