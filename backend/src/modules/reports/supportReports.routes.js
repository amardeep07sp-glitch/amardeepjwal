import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { reportSummaryQuerySchema, reportListQuerySchema } from './reports.validation.js';
import {
  getTicketSummary,
  getTicketsByCategory,
  getTicketsByStatus,
  getTicketsByAgent,
  getTicketList,
  getIssueSummary,
  getIssuesByCategory,
  getIssueList,
  getFeedbackSummary,
} from './supportReports.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/tickets/summary', protect, canView, validate(reportSummaryQuerySchema), getTicketSummary);
router.get('/tickets/by-category', protect, canView, validate(reportSummaryQuerySchema), getTicketsByCategory);
router.get('/tickets/by-status', protect, canView, validate(reportSummaryQuerySchema), getTicketsByStatus);
router.get('/tickets/by-agent', protect, canView, validate(reportSummaryQuerySchema), getTicketsByAgent);
router.get('/tickets/list', protect, canView, validate(reportListQuerySchema), getTicketList);
router.get('/issues/summary', protect, canView, validate(reportSummaryQuerySchema), getIssueSummary);
router.get('/issues/by-category', protect, canView, validate(reportSummaryQuerySchema), getIssuesByCategory);
router.get('/issues/list', protect, canView, validate(reportListQuerySchema), getIssueList);
router.get('/feedback/summary', protect, canView, getFeedbackSummary);

export default router;
