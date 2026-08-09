import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  listReferralsQuerySchema,
  referralIdSchema,
  referrerIdParamSchema,
  rewardReferralSchema,
} from './customerReferral.validation.js';
import { listReferrals, listReferralsForReferrer, completeReferral, rewardReferral } from './customerReferral.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Rewarding a referral moves real loyalty points - PRIVILEGED_ROLES only,
// same restriction tier as Wallet/Loyalty adjustments.
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listReferralsQuerySchema), listReferrals);
router.get('/referrer/:referrerId', protect, canView, validate(referrerIdParamSchema), listReferralsForReferrer);
router.patch('/:id/complete', protect, canManage, validate(referralIdSchema), completeReferral);
router.patch('/:id/reward', protect, canManage, validate(rewardReferralSchema), rewardReferral);

export default router;
