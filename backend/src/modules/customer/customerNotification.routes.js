import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { listNotificationsQuerySchema, sendNotificationSchema } from './customerNotification.validation.js';
import { listNotifications, sendNotification } from './customerNotification.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.get('/:customerId', protect, canView, validate(listNotificationsQuerySchema), listNotifications);
router.post('/:customerId/send', protect, canManage, validate(sendNotificationSchema), sendNotification);

export default router;
