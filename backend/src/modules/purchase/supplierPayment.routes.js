import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  recordPaymentSchema,
  supplierIdParamSchema,
  purchaseOrderIdParamSchema,
  paymentIdSchema,
} from './supplierPayment.validation.js';
import { listPaymentsForSupplier, listPaymentsForPurchaseOrder, recordPayment, refundPayment } from './supplierPayment.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Real money leaving the business - PRIVILEGED_ROLES only, same tier as
// Order's Refund.
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/supplier/:supplierId', protect, canView, validate(supplierIdParamSchema), listPaymentsForSupplier);
router.post('/supplier/:supplierId', protect, canManage, validate(recordPaymentSchema), recordPayment);
router.get('/purchase-order/:purchaseOrderId', protect, canView, validate(purchaseOrderIdParamSchema), listPaymentsForPurchaseOrder);
router.patch('/:id/refund', protect, canManage, validate(paymentIdSchema), refundPayment);

export default router;
