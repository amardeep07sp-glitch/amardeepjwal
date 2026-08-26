import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES, VIEW_ROLES, ROLES } from '../../constants/roles.js';
import { issueIdSchema, listIssuesQuerySchema, assignIssueSchema, updateIssueStatusSchema } from './issue.validation.js';
import { listIssues, getIssueById, assignIssue, updateIssueStatus } from './issue.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.use(protect);

router.get('/', canView, validate(listIssuesQuerySchema), listIssues);
router.get('/:id', canView, validate(issueIdSchema), getIssueById);
router.patch('/:id/assign', canManage, validate(assignIssueSchema), assignIssue);
router.patch('/:id/status', canManage, validate(updateIssueStatusSchema), updateIssueStatus);

export default router;
