import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { createSupplierSchema, updateSupplierSchema, supplierIdSchema, listSuppliersQuerySchema } from './supplier.validation.js';
import {
  listSuppliers,
  getSupplierById,
  getSupplierTimeline,
  getSupplierActivity,
  createSupplier,
  updateSupplier,
  deleteSupplier,
  getDashboardTotals,
} from './supplier.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Staff can create/edit vendor profiles at the counter without a Manager
// present - same tier as Customer profile management.
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);
const canDelete = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listSuppliersQuerySchema), listSuppliers);
router.post('/', protect, canManage, validate(createSupplierSchema), createSupplier);
router.get('/dashboard-totals', protect, canView, getDashboardTotals);

router.get('/:id', protect, canView, validate(supplierIdSchema), getSupplierById);
router.put('/:id', protect, canManage, validate(updateSupplierSchema), updateSupplier);
router.delete('/:id', protect, canDelete, validate(supplierIdSchema), deleteSupplier);
router.get('/:id/timeline', protect, canView, validate(supplierIdSchema), getSupplierTimeline);
router.get('/:id/activity', protect, canView, validate(supplierIdSchema), getSupplierActivity);

export default router;
