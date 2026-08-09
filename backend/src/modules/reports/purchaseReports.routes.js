import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { reportListQuerySchema, reportSummaryQuerySchema } from './reports.validation.js';
import {
  getPurchaseSummary,
  getSupplierWisePurchase,
  getPurchaseTrend,
  getOutstandingPurchase,
  getGrnReport,
  getPurchaseReturnReport,
} from './purchaseReports.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/summary', protect, canView, validate(reportSummaryQuerySchema), getPurchaseSummary);
router.get('/supplier-wise', protect, canView, validate(reportListQuerySchema), getSupplierWisePurchase);
router.get('/trend', protect, canView, getPurchaseTrend);
router.get('/outstanding', protect, canView, getOutstandingPurchase);
router.get('/grn', protect, canView, validate(reportListQuerySchema), getGrnReport);
router.get('/returns', protect, canView, validate(reportListQuerySchema), getPurchaseReturnReport);

export default router;
