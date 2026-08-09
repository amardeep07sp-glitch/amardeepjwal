import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import { segmentKeyParamSchema } from './segmentation.validation.js';
import { recomputeSegments, getSegmentCounts, listBySegment } from './segmentation.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.post('/recompute', protect, authorize(...PRIVILEGED_ROLES), recomputeSegments);
router.get('/counts', protect, canView, getSegmentCounts);
router.get('/:segmentKey', protect, canView, validate(segmentKeyParamSchema), listBySegment);

export default router;
