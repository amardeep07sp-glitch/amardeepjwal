import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { supplierLedgerQuerySchema } from './supplierLedger.validation.js';
import { getSupplierLedger } from './supplierLedger.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/:supplierId', protect, canView, validate(supplierLedgerQuerySchema), getSupplierLedger);

export default router;
