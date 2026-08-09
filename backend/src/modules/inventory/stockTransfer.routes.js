import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  requestTransferSchema,
  transferIdSchema,
  listTransfersQuerySchema,
} from './stockTransfer.validation.js';
import {
  listTransfers,
  getTransferById,
  requestTransfer,
  approveTransfer,
  rejectTransfer,
  completeTransfer,
  cancelTransfer,
} from './stockTransfer.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManageTransfers = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listTransfersQuerySchema), listTransfers);
router.post('/', protect, canManageTransfers, validate(requestTransferSchema), requestTransfer);

router.get('/:id', protect, canView, validate(transferIdSchema), getTransferById);
router.patch('/:id/approve', protect, canManageTransfers, validate(transferIdSchema), approveTransfer);
router.patch('/:id/reject', protect, canManageTransfers, validate(transferIdSchema), rejectTransfer);
router.patch('/:id/complete', protect, canManageTransfers, validate(transferIdSchema), completeTransfer);
router.patch('/:id/cancel', protect, canManageTransfers, validate(transferIdSchema), cancelTransfer);

export default router;
