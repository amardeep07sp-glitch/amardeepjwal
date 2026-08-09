import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { createSegmentSchema, updateSegmentSchema, segmentIdSchema } from './customerSegment.validation.js';
import { listSegments, getSegmentById, createSegment, updateSegment, deleteSegment } from './customerSegment.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);
const canDelete = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, listSegments);
router.post('/', protect, canManage, validate(createSegmentSchema), createSegment);
router.get('/:id', protect, canView, validate(segmentIdSchema), getSegmentById);
router.put('/:id', protect, canManage, validate(updateSegmentSchema), updateSegment);
router.delete('/:id', protect, canDelete, validate(segmentIdSchema), deleteSegment);

export default router;
