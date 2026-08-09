import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { customerIdParamSchema } from './privacy.validation.js';
import { deleteCustomerData } from './privacy.controller.js';

const router = Router();
// A data-subject erasure request naming a real Customer is a sensitive,
// rarely-run admin action - PRIVILEGED_ROLES only.
router.delete('/customers/:customerId', protect, authorize(...PRIVILEGED_ROLES), validate(customerIdParamSchema), deleteCustomerData);

export default router;
