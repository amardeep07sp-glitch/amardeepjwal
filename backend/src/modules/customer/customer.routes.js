import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { handleCustomerCsvUpload } from './customer.upload.middleware.js';
import {
  createCustomerSchema,
  updateCustomerSchema,
  customerIdSchema,
  listCustomersQuerySchema,
  bulkStatusSchema,
  tagAssignSchema,
  segmentAssignSchema,
} from './customer.validation.js';
import {
  listCustomers,
  getCustomerById,
  getCustomerTimeline,
  getCustomerActivity,
  createCustomer,
  updateCustomer,
  deleteCustomer,
  bulkUpdateStatus,
  assignTag,
  removeTag,
  assignSegment,
  removeSegment,
  getDashboardTotals,
  getGrowthTrend,
  exportCustomers,
  importCustomers,
  downloadStatement,
} from './customer.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Staff build customer profiles at POS without a Manager present.
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);
const canDelete = authorize(...PRIVILEGED_ROLES);
// Same role set as canDelete (PRIVILEGED_ROLES) - kept as its own name for
// readability at the route definitions below.
const canExportImport = canDelete;

router.get('/', protect, canView, validate(listCustomersQuerySchema), listCustomers);
router.post('/', protect, canManage, validate(createCustomerSchema), createCustomer);
router.patch('/bulk-status', protect, canManage, validate(bulkStatusSchema), bulkUpdateStatus);
router.get('/dashboard-totals', protect, canView, getDashboardTotals);
router.get('/growth-trend', protect, canView, getGrowthTrend);
router.get('/export', protect, canExportImport, exportCustomers);
router.post('/import', protect, canExportImport, handleCustomerCsvUpload, importCustomers);

router.get('/:id', protect, canView, validate(customerIdSchema), getCustomerById);
router.put('/:id', protect, canManage, validate(updateCustomerSchema), updateCustomer);
router.delete('/:id', protect, canDelete, validate(customerIdSchema), deleteCustomer);
router.get('/:id/statement', protect, canView, validate(customerIdSchema), downloadStatement);
router.get('/:id/timeline', protect, canView, validate(customerIdSchema), getCustomerTimeline);
router.get('/:id/activity', protect, canView, validate(customerIdSchema), getCustomerActivity);

router.post('/:id/tags/:tagId', protect, canManage, validate(tagAssignSchema), assignTag);
router.delete('/:id/tags/:tagId', protect, canManage, validate(tagAssignSchema), removeTag);
router.post('/:id/segments/:segmentId', protect, canManage, validate(segmentAssignSchema), assignSegment);
router.delete('/:id/segments/:segmentId', protect, canManage, validate(segmentAssignSchema), removeSegment);

export default router;
