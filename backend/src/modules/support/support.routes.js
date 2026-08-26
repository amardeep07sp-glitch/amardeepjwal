import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES, VIEW_ROLES, ROLES } from '../../constants/roles.js';
import { handleAttachmentsUpload } from '../media/media.upload.middleware.js';
import {
  createTicketAdminSchema,
  ticketIdSchema,
  listTicketsQuerySchema,
  assignTicketSchema,
  updatePrioritySchema,
  updateStatusSchema,
  addAgentMessageSchema,
  updateSlaPolicySchema,
  setAssignmentRuleSchema,
  assignmentRuleCategoryParamSchema,
} from './support.validation.js';
import {
  listTickets,
  getDashboardCounts,
  getTicketById,
  createTicketAdmin,
  assignTicket,
  updatePriority,
  updateStatus,
  addAgentMessage,
  getSlaPolicy,
  updateSlaPolicy,
  listAssignmentRules,
  setAssignmentRule,
  removeAssignmentRule,
} from './support.controller.js';

const router = Router();
// SUPPORT_AGENT/SUPPORT_MANAGER (added on top of the original STAFF-reuse
// decision) get into the support module specifically - controller-level
// scoping below then narrows a plain SUPPORT_AGENT down to only their own
// assigned tickets, while STAFF/PRIVILEGED/SUPPORT_MANAGER keep seeing
// everything, same as before this pass. Existing STAFF/MANAGER accounts
// are completely unaffected - this is additive, not a replacement.
const canView = authorize(...VIEW_ROLES, ROLES.SUPPORT_AGENT, ROLES.SUPPORT_MANAGER);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF, ROLES.SUPPORT_AGENT, ROLES.SUPPORT_MANAGER);
// SLA policy/routing rules are business configuration, not routine ticket
// work - SUPPORT_MANAGER can configure them (they own the desk), but a
// plain SUPPORT_AGENT cannot, same bar STAFF is already held to elsewhere.
const canConfigure = authorize(...PRIVILEGED_ROLES, ROLES.SUPPORT_MANAGER);

router.use(protect);

router.get('/tickets/dashboard', canView, getDashboardCounts);
router.get('/tickets', canView, validate(listTicketsQuerySchema), listTickets);
router.post('/tickets', canManage, validate(createTicketAdminSchema), createTicketAdmin);
router.get('/tickets/:id', canView, validate(ticketIdSchema), getTicketById);
router.patch('/tickets/:id/assign', canManage, validate(assignTicketSchema), assignTicket);
router.patch('/tickets/:id/priority', canManage, validate(updatePrioritySchema), updatePriority);
router.patch('/tickets/:id/status', canManage, validate(updateStatusSchema), updateStatus);
router.post('/tickets/:id/messages', canManage, handleAttachmentsUpload, validate(addAgentMessageSchema), addAgentMessage);

router.get('/sla-policy', canView, getSlaPolicy);
router.put('/sla-policy', canConfigure, validate(updateSlaPolicySchema), updateSlaPolicy);

router.get('/assignment-rules', canView, listAssignmentRules);
router.put('/assignment-rules', canConfigure, validate(setAssignmentRuleSchema), setAssignmentRule);
router.delete('/assignment-rules/:category', canConfigure, validate(assignmentRuleCategoryParamSchema), removeAssignmentRule);

export default router;
