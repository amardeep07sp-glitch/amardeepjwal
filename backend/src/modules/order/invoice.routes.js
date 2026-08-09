import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { orderIdParamSchema } from './orderPayment.validation.js';
import { listInvoicesQuerySchema } from './invoice.validation.js';
import { downloadInvoice, listInvoices } from './invoice.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/', protect, canView, validate(listInvoicesQuerySchema), listInvoices);
router.get('/order/:orderId/download', protect, canView, validate(orderIdParamSchema), downloadInvoice);

export default router;
