import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { updateMetalRateSchema } from './metalRate.validation.js';
import { getMetalRates, updateMetalRates, getPublicMetalRates } from './metalRate.controller.js';

const router = Router();

// Public - a storefront widget/page reads today's rate without logging in.
router.get('/public', getPublicMetalRates);

router.get('/', protect, getMetalRates);
router.patch('/', protect, authorize(...PRIVILEGED_ROLES), validate(updateMetalRateSchema), updateMetalRates);

export default router;
