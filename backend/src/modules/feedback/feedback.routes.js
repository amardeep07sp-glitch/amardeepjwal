import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { listFeedbackQuerySchema } from './feedback.validation.js';
import { listFeedback, getFeedbackSummary } from './feedback.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

// Staff-only read surface - submission happens via the storefront module
// (an authenticated customer's own action), never here.
router.use(protect, canView);

router.get('/', validate(listFeedbackQuerySchema), listFeedback);
router.get('/summary', getFeedbackSummary);

export default router;
