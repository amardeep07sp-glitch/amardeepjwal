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

export const register = asyncHandler(async (req, res) => {
  const result = await authService.register(req.body);
  sendAuthResponse(req, res, 201, result, 'Account created successfully');
});

export const login = asyncHandler(async (req, res) => {
  const { identifier, password } = req.body;
  const result = await authService.login(identifier, password);
  sendAuthResponse(req, res, 200, result, 'Logged in successfully');
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

export const getMe = asyncHandler(async (req, res) => {
  res.status(200).json(new ApiResponse(200, authService.sanitizeUser(req.user), 'Current user fetched'));
});
