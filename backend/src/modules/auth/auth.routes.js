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

export default router;
