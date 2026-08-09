import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { reportListQuerySchema, reportSummaryQuerySchema } from './reports.validation.js';
import {
  getSupplierPerformance,
  getOutstandingPayables,
  getPurchaseVolume,
  getSupplierAging,
  getPurchaseReturnsBySupplier,
} from './supplierReports.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/performance', protect, canView, getSupplierPerformance);
router.get('/outstanding-payables', protect, canView, getOutstandingPayables);
router.get('/purchase-volume', protect, canView, validate(reportListQuerySchema), getPurchaseVolume);
router.get('/aging', protect, canView, validate(reportSummaryQuerySchema), getSupplierAging);
router.get('/returns', protect, canView, validate(reportListQuerySchema), getPurchaseReturnsBySupplier);

export default router;
