import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import {
  createPurchaseOrderSchema,
  purchaseOrderIdSchema,
  listPurchaseOrdersQuerySchema,
  cancelPurchaseOrderSchema,
} from './purchaseOrder.validation.js';
import {
  listPurchaseOrders,
  getPurchaseOrderById,
  createPurchaseOrder,
  submitForApproval,
  approvePurchaseOrder,
  markOrdered,
  cancelPurchaseOrder,
  getDashboardTotals,
  getPurchaseTrend,
  getSupplierPerformance,
} from './purchaseOrder.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Staff draft/submit/mark-ordered POs without a Manager present - Approve
// and Cancel stay one notch more restricted (financial commitment points).
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);
const canApproveOrCancel = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listPurchaseOrdersQuerySchema), listPurchaseOrders);
router.post('/', protect, canManage, validate(createPurchaseOrderSchema), createPurchaseOrder);

router.get('/dashboard-totals', protect, canView, getDashboardTotals);
router.get('/purchase-trend', protect, canView, getPurchaseTrend);
router.get('/supplier-performance', protect, canView, getSupplierPerformance);

router.get('/:id', protect, canView, validate(purchaseOrderIdSchema), getPurchaseOrderById);
router.patch('/:id/submit', protect, canManage, validate(purchaseOrderIdSchema), submitForApproval);
router.patch('/:id/approve', protect, canApproveOrCancel, validate(purchaseOrderIdSchema), approvePurchaseOrder);
router.patch('/:id/mark-ordered', protect, canManage, validate(purchaseOrderIdSchema), markOrdered);
router.patch('/:id/cancel', protect, canApproveOrCancel, validate(cancelPurchaseOrderSchema), cancelPurchaseOrder);

export default router;
