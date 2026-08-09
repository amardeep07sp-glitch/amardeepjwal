import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createAdjustmentSchema,
  adjustmentIdSchema,
  listAdjustmentsQuerySchema,
} from './stockAdjustment.validation.js';
import {
  listAdjustments,
  getAdjustmentById,
  createAdjustment,
  approveAdjustment,
  rejectAdjustment,
} from './stockAdjustment.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Any authenticated staff member may request an adjustment - it's created
// pending unless they're privileged (see stockAdjustmentService#createAdjustment).
const canRequest = authorize(...VIEW_ROLES);
const canApprove = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listAdjustmentsQuerySchema), listAdjustments);
router.post('/', protect, canRequest, validate(createAdjustmentSchema), createAdjustment);

router.get('/:id', protect, canView, validate(adjustmentIdSchema), getAdjustmentById);
router.patch('/:id/approve', protect, canApprove, validate(adjustmentIdSchema), approveAdjustment);
router.patch('/:id/reject', protect, canApprove, validate(adjustmentIdSchema), rejectAdjustment);

export default router;
