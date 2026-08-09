import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { listActivityQuerySchema } from './activityLog.validation.js';
import { listActivityLogs } from './activityLog.controller.js';

const router = Router();

router.get('/', protect, authorize(...PRIVILEGED_ROLES), validate(listActivityQuerySchema), listActivityLogs);

export default router;
