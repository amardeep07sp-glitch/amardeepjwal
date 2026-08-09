import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createTaxRateSchema, updateTaxRateSchema, taxRateIdSchema, taxSummaryQuerySchema } from './taxRate.validation.js';
import { listTaxRates, createTaxRate, updateTaxRate, deleteTaxRate, getTaxSummary } from './taxRate.controller.js';

const router = Router();
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canManage, listTaxRates);
router.post('/', protect, canManage, validate(createTaxRateSchema), createTaxRate);
router.put('/:id', protect, canManage, validate(updateTaxRateSchema), updateTaxRate);
router.delete('/:id', protect, canManage, validate(taxRateIdSchema), deleteTaxRate);
router.get('/summary', protect, canManage, validate(taxSummaryQuerySchema), getTaxSummary);

export default router;
