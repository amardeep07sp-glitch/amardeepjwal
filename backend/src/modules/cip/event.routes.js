import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { listEventsQuerySchema, sessionIdParamSchema } from './event.validation.js';
import { listEvents, getSessionJourney } from './event.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/', protect, canView, validate(listEventsQuerySchema), listEvents);
router.get('/session/:sessionId', protect, canView, validate(sessionIdParamSchema), getSessionJourney);

export default router;
