import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { requestReturnSchema, returnIdSchema, listReturnsQuerySchema } from './orderReturn.validation.js';
import { orderIdParamSchema } from './orderPayment.validation.js';
import {
  listReturns,
  listReturnsForOrder,
  requestReturn,
  approveReturn,
  rejectReturn,
  schedulePickup,
  markReceived,
  markInspected,
  acceptReturn,
  restockReturn,
} from './orderReturn.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.get('/', protect, canView, validate(listReturnsQuerySchema), listReturns);
router.get('/order/:orderId', protect, canView, validate(orderIdParamSchema), listReturnsForOrder);
router.post('/order/:orderId', protect, canManage, validate(requestReturnSchema), requestReturn);

router.patch('/:id/approve', protect, canManage, validate(returnIdSchema), approveReturn);
router.patch('/:id/reject', protect, canManage, validate(returnIdSchema), rejectReturn);
router.patch('/:id/schedule-pickup', protect, canManage, validate(returnIdSchema), schedulePickup);
router.patch('/:id/receive', protect, canManage, validate(returnIdSchema), markReceived);
router.patch('/:id/inspect', protect, canManage, validate(returnIdSchema), markInspected);
router.patch('/:id/accept', protect, canManage, validate(returnIdSchema), acceptReturn);
router.patch('/:id/restock', protect, canManage, validate(returnIdSchema), restockReturn);

export default router;
