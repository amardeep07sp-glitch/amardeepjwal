import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { activityQuerySchema, timelineReportQuerySchema } from './activityReports.validation.js';
import { getUserActivity, getCustomerActivity, getSupplierActivity, getAuditLogs, getTimelineReport } from './activityReports.controller.js';

const router = Router();
// Audit-grade data - PRIVILEGED_ROLES only, matching the existing
// activityLog.routes.js precedent exactly.
const canView = authorize(...PRIVILEGED_ROLES);

router.get('/user', protect, canView, validate(activityQuerySchema), getUserActivity);
router.get('/customer', protect, canView, validate(activityQuerySchema), getCustomerActivity);
router.get('/supplier', protect, canView, validate(activityQuerySchema), getSupplierActivity);
router.get('/audit-logs', protect, canView, validate(activityQuerySchema), getAuditLogs);
router.get('/timeline', protect, canView, validate(timelineReportQuerySchema), getTimelineReport);

export default router;
