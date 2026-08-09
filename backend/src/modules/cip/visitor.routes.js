import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { listVisitorsQuerySchema, visitorIdParamSchema } from './visitor.validation.js';
import { listVisitors, getVisitor } from './visitor.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/', protect, canView, validate(listVisitorsQuerySchema), listVisitors);
router.get('/:visitorId', protect, canView, validate(visitorIdParamSchema), getVisitor);

export default router;
