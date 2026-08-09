import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import {
  recordManualPaymentSchema,
  initiateRazorpaySchema,
  verifyRazorpaySchema,
  orderIdParamSchema,
} from './orderPayment.validation.js';
import {
  listPaymentsForOrder,
  recordManualPayment,
  initiateRazorpayPayment,
  verifyRazorpayPayment,
  razorpayWebhook,
} from './orderPayment.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

// Unauthenticated by design - see orderPayment.controller.js#razorpayWebhook
// for how it authenticates itself (HMAC signature, not a session).
router.post('/webhook', razorpayWebhook);

router.get('/order/:orderId', protect, canView, validate(orderIdParamSchema), listPaymentsForOrder);
router.post('/order/:orderId/manual', protect, canManage, validate(recordManualPaymentSchema), recordManualPayment);
router.post('/order/:orderId/razorpay/initiate', protect, canManage, validate(initiateRazorpaySchema), initiateRazorpayPayment);
router.post('/razorpay/verify', protect, canManage, validate(verifyRazorpaySchema), verifyRazorpayPayment);

export default router;
