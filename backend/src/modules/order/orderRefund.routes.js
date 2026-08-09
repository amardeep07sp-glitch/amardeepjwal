import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createRefundSchema, processRefundSchema, refundIdSchema, listRefundsQuerySchema } from './orderRefund.validation.js';
import { orderIdParamSchema } from './orderPayment.validation.js';
import { listRefunds, listRefundsForOrder, createRefund, processRefund, failRefund } from './orderRefund.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Refunds move real money back out - kept to PRIVILEGED_ROLES only (unlike
// most Order actions, Staff cannot process these).
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listRefundsQuerySchema), listRefunds);
router.get('/order/:orderId', protect, canView, validate(orderIdParamSchema), listRefundsForOrder);
router.post('/order/:orderId', protect, canManage, validate(createRefundSchema), createRefund);

router.patch('/:id/process', protect, canManage, validate(processRefundSchema), processRefund);
router.patch('/:id/fail', protect, canManage, validate(refundIdSchema), failRefund);

export default router;
