import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createCouponSchema, updateCouponSchema, couponIdSchema, listCouponsQuerySchema, listRedemptionsQuerySchema } from './coupon.validation.js';
import {
  listCoupons,
  getCouponById,
  createCoupon,
  updateCoupon,
  deleteCoupon,
  listRedemptions,
  getCouponAnalytics,
} from './coupon.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listCouponsQuerySchema), listCoupons);
router.post('/', protect, canManage, validate(createCouponSchema), createCoupon);

router.get('/redemptions', protect, canView, validate(listRedemptionsQuerySchema), listRedemptions);

router.get('/:id', protect, canView, validate(couponIdSchema), getCouponById);
router.put('/:id', protect, canManage, validate(updateCouponSchema), updateCoupon);
router.delete('/:id', protect, canManage, validate(couponIdSchema), deleteCoupon);
router.get('/:id/analytics', protect, canView, validate(couponIdSchema), getCouponAnalytics);

export default router;
