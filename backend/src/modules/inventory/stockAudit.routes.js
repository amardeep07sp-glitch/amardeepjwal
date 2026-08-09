import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createAuditSchema, auditIdSchema, listAuditsQuerySchema } from './stockAudit.validation.js';
import { listAudits, getAuditById, createAudit, completeAudit } from './stockAudit.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canAudit = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listAuditsQuerySchema), listAudits);
router.post('/', protect, canAudit, validate(createAuditSchema), createAudit);

router.get('/:id', protect, canView, validate(auditIdSchema), getAuditById);
router.patch('/:id/complete', protect, canAudit, validate(auditIdSchema), completeAudit);

export default router;
