import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { updatePreferenceSchema, customerIdParamSchema } from './customerPreference.validation.js';
import { getPreference, updatePreference } from './customerPreference.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.get('/:customerId', protect, canView, validate(customerIdParamSchema), getPreference);
router.put('/:customerId', protect, canManage, validate(updatePreferenceSchema), updatePreference);

export default router;
