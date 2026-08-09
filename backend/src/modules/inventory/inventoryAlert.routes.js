import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import { listAlertsQuerySchema, alertIdSchema } from './inventoryAlert.validation.js';
import { listAlerts, acknowledgeAlert, resolveAlert } from './inventoryAlert.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const manageAlerts = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listAlertsQuerySchema), listAlerts);
router.patch('/:id/acknowledge', protect, manageAlerts, validate(alertIdSchema), acknowledgeAlert);
router.patch('/:id/resolve', protect, manageAlerts, validate(alertIdSchema), resolveAlert);

export default router;
