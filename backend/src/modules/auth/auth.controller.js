import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { authService } from './auth.service.js';
import { env } from '../../config/env.js';

// The customer storefront (client/) and the staff admin ERP (frontend/)
// are two separate apps that both call this same backend on the same
// host - cookies aren't scoped by port, so a single shared cookie name
// meant logging into one app silently overwrote the other's session
// cookie in the same browser (e.g. testing a customer login would kick
// out an already-logged-in admin tab). Each frontend sends which app
// it is via this header (see client/frontend authStore.js's authFetch);
// an unrecognized/missing value falls back to the storefront's cookie,
// the lower-privilege and more common caller.
const APP_COOKIE_NAMES = {
  admin: 'refreshToken_admin',
  storefront: 'refreshToken_storefront',
};

const resolveCookieName = (req) => APP_COOKIE_NAMES[req.headers['x-app-client']] ?? APP_COOKIE_NAMES.storefront;

const refreshCookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict',
  maxAge: 30 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
};

const sendAuthResponse = (req, res, statusCode, { user, accessToken, refreshToken }, message) => {
  res.cookie(resolveCookieName(req), refreshToken, refreshCookieOptions);
  res.status(statusCode).json(new ApiResponse(statusCode, { user, accessToken }, message));
};

export const startRegistration = asyncHandler(async (req, res) => {
  await authService.startRegistration(req.body);
  res.status(200).json(new ApiResponse(200, null, 'Verification code sent to your email'));
});

export const resendRegistrationOtp = asyncHandler(async (req, res) => {
  await authService.resendRegistrationOtp(req.body.email);
  res.status(200).json(new ApiResponse(200, null, 'Verification code resent'));
});

export const register = asyncHandler(async (req, res) => {
  const result = await authService.completeRegistration(req.body);
  sendAuthResponse(req, res, 201, result, 'Account created successfully');
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login(identifier, password);
  sendAuthResponse(req, res, 200, result, 'Logged in successfully');
});

export const googleLogin = asyncHandler(async (req, res) => {
  const result = await authService.loginWithGoogle(req.body.idToken);
  sendAuthResponse(req, res, 200, result, 'Logged in with Google successfully');
});

export const refreshToken = asyncHandler(async (req, res) => {
  const oldRefreshToken = req.cookies?.[resolveCookieName(req)];
  const result = await authService.refresh(oldRefreshToken);
  sendAuthResponse(req, res, 200, result, 'Token refreshed successfully');
});

export const logout = asyncHandler(async (req, res) => {
  await authService.logout(req.user.id);
  res.clearCookie(resolveCookieName(req), { path: '/api/v1/auth' });
  res.status(200).json(new ApiResponse(200, null, 'Logged out successfully'));
});

export const forgotPassword = asyncHandler(async (req, res) => {
  await authService.requestPasswordReset(req.body.email);
  // Same response whether or not the email is real - see
  // auth.service.js#requestPasswordReset's own comment.
  res.status(200).json(new ApiResponse(200, null, 'If an account exists for that email, a reset link has been sent.'));
});

export const resetPassword = asyncHandler(async (req, res) => {
  await authService.resetPassword(req.body);
  res.status(200).json(new ApiResponse(200, null, 'Password reset successfully - please log in with your new password.'));
});

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, authService.sanitizeUser(req.user), 'Current user fetched'));
});

export const listStaffUsers = asyncHandler(async (req, res) => {
  const { items, total } = await authService.listStaffUsers(req.query);
  res.status(200).json(new ApiResponse(200, { items, meta: { page: req.query.page, limit: req.query.limit, totalItems: total } }, 'Staff users fetched successfully'));
});

export const createStaff = asyncHandler(async (req, res) => {
  const user = await authService.createStaffUser(req.body);
  res.status(201).json(new ApiResponse(201, user, 'Staff account created successfully'));
});

export const updateStaff = asyncHandler(async (req, res) => {
  const user = await authService.updateStaffUser(req.params.id, req.body, req.user._id);
  res.status(200).json(new ApiResponse(200, user, 'Staff account updated successfully'));
});
