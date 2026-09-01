import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { authLimiter, otpLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { VIEW_ROLES, ROLES } from '../../constants/roles.js';
import {
  startRegistrationSchema,
  resendRegistrationOtpSchema,
  completeRegistrationSchema,
  loginSchema,
  googleLoginSchema,
  forgotPasswordSchema,
  resetPasswordSchema,
  listStaffUsersQuerySchema,
  createStaffSchema,
  updateStaffSchema,
} from './auth.validation.js';
import {
  startRegistration,
  resendRegistrationOtp,
  register,
  login,
  googleLogin,
  refreshToken,
  logout,
  forgotPassword,
  resetPassword,
  getMe,
  listStaffUsers,
  createStaff,
  updateStaff,
} from './auth.controller.js';

const router = Router();

router.post('/register/send-otp', otpLimiter, validate(startRegistrationSchema), startRegistration);
router.post('/register/resend-otp', otpLimiter, validate(resendRegistrationOtpSchema), resendRegistrationOtp);
router.post('/register', authLimiter, validate(completeRegistrationSchema), register);
router.post('/login', authLimiter, validate(loginSchema), login);
router.post('/google', authLimiter, validate(googleLoginSchema), googleLogin);
router.post('/refresh-token', refreshToken);
router.post('/logout', protect, logout);
router.post('/forgot-password', authLimiter, validate(forgotPasswordSchema), forgotPassword);
router.post('/reset-password', authLimiter, validate(resetPasswordSchema), resetPassword);
router.get('/me', protect, getMe);

// Backs agent-picker UIs (currently: support Assignment Rules) - any admin
// viewer can look up staff by name, same visibility bar as every other
// staff-directory-shaped read in this app.
router.get('/users', protect, authorize(...VIEW_ROLES, ROLES.SUPPORT_AGENT, ROLES.SUPPORT_MANAGER), validate(listStaffUsersQuerySchema), listStaffUsers);

// Staff provisioning (Admin -> Settings -> Staff) - Super Admin only, not
// the broader PRIVILEGED_ROLES set every other "manage" route in this app
// uses. Creating an account that can itself hold super_admin/admin is a
// meaningfully bigger blast radius than managing catalog/orders/etc., so
// this stays deliberately narrower than that shared precedent.
router.post('/staff', protect, authorize(ROLES.SUPER_ADMIN), validate(createStaffSchema), createStaff);
router.patch('/staff/:id', protect, authorize(ROLES.SUPER_ADMIN), validate(updateStaffSchema), updateStaff);

export default router;
