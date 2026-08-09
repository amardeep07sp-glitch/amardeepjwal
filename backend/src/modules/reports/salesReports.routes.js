import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { reportListQuerySchema, reportSummaryQuerySchema } from './reports.validation.js';
import {
  getSalesSummary,
  getSalesByProduct,
  getSalesByCategory,
  getSalesByBrand,
  getSalesByCustomer,
  getSalesBySalesperson,
  getSalesByDate,
  getCancelledOrders,
  getRefunds,
} from './salesReports.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/summary', protect, canView, validate(reportSummaryQuerySchema), getSalesSummary);
router.get('/by-product', protect, canView, validate(reportListQuerySchema), getSalesByProduct);
router.get('/by-category', protect, canView, validate(reportListQuerySchema), getSalesByCategory);
router.get('/by-brand', protect, canView, validate(reportListQuerySchema), getSalesByBrand);
router.get('/by-customer', protect, canView, validate(reportListQuerySchema), getSalesByCustomer);
router.get('/by-salesperson', protect, canView, validate(reportSummaryQuerySchema), getSalesBySalesperson);
router.get('/by-date', protect, canView, validate(reportSummaryQuerySchema), getSalesByDate);
router.get('/cancelled-orders', protect, canView, validate(reportListQuerySchema), getCancelledOrders);
router.get('/refunds', protect, canView, validate(reportListQuerySchema), getRefunds);

export default router;
