import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import {
  requestReturnSchema,
  purchaseOrderIdParamSchema,
  returnIdSchema,
  listReturnsQuerySchema,
} from './purchaseReturn.validation.js';
import {
  listReturns,
  listReturnsForPurchaseOrder,
  requestReturn,
  approveReturn,
  rejectReturn,
  completeReturn,
} from './purchaseReturn.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Staff can request a return from the receiving counter - Approve/Reject/
// Complete (the steps with a real financial and stock effect) stay one
// notch more restricted, same tier as Order Return's approve/restock.
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);
const canApproveOrComplete = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listReturnsQuerySchema), listReturns);
router.get('/purchase-order/:purchaseOrderId', protect, canView, validate(purchaseOrderIdParamSchema), listReturnsForPurchaseOrder);
router.post('/purchase-order/:purchaseOrderId', protect, canManage, validate(requestReturnSchema), requestReturn);

router.patch('/:id/approve', protect, canApproveOrComplete, validate(returnIdSchema), approveReturn);
router.patch('/:id/reject', protect, canApproveOrComplete, validate(returnIdSchema), rejectReturn);
router.patch('/:id/complete', protect, canApproveOrComplete, validate(returnIdSchema), completeReturn);

export default router;
