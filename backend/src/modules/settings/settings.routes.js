import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { updateSettingsSchema } from './settings.validation.js';
import { getSettings, updateSettings } from './settings.controller.js';

const router = Router();

router.get('/', protect, getSettings);
router.patch('/', protect, authorize(...PRIVILEGED_ROLES), validate(updateSettingsSchema), updateSettings);

export default router;
