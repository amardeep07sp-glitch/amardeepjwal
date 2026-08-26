import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  listReviewsQuerySchema,
  moderateReviewSchema,
  reviewIdParamSchema,
  reportedReviewsQuerySchema,
  reportIdParamSchema,
} from './review.validation.js';
import { listReviews, moderateReview, deleteReview, listReportedReviews, getReportsForReview, dismissReport } from './review.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canModerate = authorize(...PRIVILEGED_ROLES);

// Must come before `/:id/...` routes below - otherwise Express would try
// to match "reported" itself as an `:id` param.
router.get('/reported', protect, canView, validate(reportedReviewsQuerySchema), listReportedReviews);
router.patch('/reports/:reportId/dismiss', protect, canModerate, validate(reportIdParamSchema), dismissReport);

router.get('/', protect, canView, validate(listReviewsQuerySchema), listReviews);
router.get('/:id/reports', protect, canView, validate(reviewIdParamSchema), getReportsForReview);
router.patch('/:id/status', protect, canModerate, validate(moderateReviewSchema), moderateReview);
router.delete('/:id', protect, canModerate, validate(reviewIdParamSchema), deleteReview);

export default router;
