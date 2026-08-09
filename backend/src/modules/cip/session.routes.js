import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { listSessionsQuerySchema } from './session.validation.js';
import { listSessions, getActiveSessionCount } from './session.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/', protect, canView, validate(listSessionsQuerySchema), listSessions);
router.get('/active-count', protect, canView, getActiveSessionCount);

export default router;
