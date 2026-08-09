import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { reportSummaryQuerySchema } from './reports.validation.js';
import {
  getGstSummary,
  getCgstReport,
  getSgstReport,
  getIgstReport,
  getInputTaxReport,
  getOutputTaxReport,
  getTaxLiability,
} from './taxReports.controller.js';

const router = Router();
// Tax reports carry the same sensitivity as Accounting's own Tax Engine -
// PRIVILEGED_ROLES only, matching Phase 10's precedent.
const canView = authorize(...PRIVILEGED_ROLES);

router.get('/gst-summary', protect, canView, validate(reportSummaryQuerySchema), getGstSummary);
router.get('/cgst', protect, canView, validate(reportSummaryQuerySchema), getCgstReport);
router.get('/sgst', protect, canView, validate(reportSummaryQuerySchema), getSgstReport);
router.get('/igst', protect, canView, validate(reportSummaryQuerySchema), getIgstReport);
router.get('/input-tax', protect, canView, validate(reportSummaryQuerySchema), getInputTaxReport);
router.get('/output-tax', protect, canView, validate(reportSummaryQuerySchema), getOutputTaxReport);
router.get('/liability', protect, canView, validate(reportSummaryQuerySchema), getTaxLiability);

export default router;
