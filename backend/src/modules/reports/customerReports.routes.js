import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { reportListQuerySchema } from './reports.validation.js';
import {
  getCustomerGrowth,
  getCustomerLifetimeValue,
  getRepeatCustomers,
  getNewCustomers,
  getWalletSummary,
  getLoyaltySummary,
  getReferralSummary,
  getVipCustomers,
} from './customerReports.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/growth', protect, canView, getCustomerGrowth);
router.get('/lifetime-value', protect, canView, validate(reportListQuerySchema), getCustomerLifetimeValue);
router.get('/repeat', protect, canView, validate(reportListQuerySchema), getRepeatCustomers);
router.get('/new', protect, canView, validate(reportListQuerySchema), getNewCustomers);
router.get('/wallet-summary', protect, canView, getWalletSummary);
router.get('/loyalty-summary', protect, canView, getLoyaltySummary);
router.get('/referral-summary', protect, canView, getReferralSummary);
router.get('/vip', protect, canView, validate(reportListQuerySchema), getVipCustomers);

export default router;
