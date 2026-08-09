import bcrypt from 'bcrypt';
import { ApiError } from '../../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/generateTokens.js';
import { userRepository } from './auth.repository.js';
import { storefrontService } from '../storefront/storefront.service.js';

// This route only ever registers role=customer (auth.model.js's own
// default - staff accounts are provisioned separately, by an admin, never
// through this public endpoint), so auto-provisioning the matching CRM
// Customer record - via storefrontService.resolveCustomer, the same
// find-link-or-create logic every storefront route already resolves
// through - closes Phase 8's "User and Customer are deliberately separate
// collections" gap for the one path that actually needs both to exist
// together from the start, rather than duplicating that logic here.

const sanitizeUser = (user) => ({
  id: user._id,
  name: user.name,
  email: user.email,
  phone: user.phone,
  role: user.role,
  isActive: user.isActive,
});

const issueTokens = async (user) => {
  const payload = { sub: user._id.toString(), role: user.role };
  const accessToken = generateAccessToken(payload);
  const refreshToken = generateRefreshToken(payload);

  const refreshTokenHash = await bcrypt.hash(refreshToken, 10);
  await userRepository.setRefreshTokenHash(user._id, refreshTokenHash);

  return { accessToken, refreshToken };
};

export const authService = {
  async register(data) {
    const existing = await userRepository.findByEmail(data.email);
    if (existing) {
      throw new ApiError(409, 'An account with this email already exists');
    }

    const user = await userRepository.create(data);
    await storefrontService.resolveCustomer(user);
    const tokens = await issueTokens(user);

    return { user: sanitizeUser(user), ...tokens };
  },

  async login(identifier, password) {
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await userRepository.findByEmail(identifier, { withPassword: true })
      : await userRepository.findByPhone(identifier, { withPassword: true });

    if (!user || !(await user.comparePassword(password))) {
      throw new ApiError(401, 'Invalid email or password');
    }
    if (!user.isActive) {
      throw new ApiError(403, 'This account has been deactivated');
    }

    // Lazily backfills the Customer link for any account created before
    // this provisioning existed (e.g. this session's own dev/test user) -
    // login is the next guaranteed touchpoint after register for those.
    await storefrontService.resolveCustomer(user);

    const tokens = await issueTokens(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async refresh(oldRefreshToken) {
    if (!oldRefreshToken) {
      throw new ApiError(401, 'Refresh token is required');
    }

    let decoded;
    try {
      decoded = verifyRefreshToken(oldRefreshToken);
    } catch {
      throw new ApiError(401, 'Invalid or expired refresh token');
    }

    const user = await userRepository.findById(decoded.sub, { withRefreshToken: true });
    if (!user || !user.refreshTokenHash) {
      throw new ApiError(401, 'Invalid session, please log in again');
    }

    const isValid = await bcrypt.compare(oldRefreshToken, user.refreshTokenHash);
    if (!isValid) {
      throw new ApiError(401, 'Invalid session, please log in again');
    }

    const tokens = await issueTokens(user);
    return { user: sanitizeUser(user), ...tokens };
  },

  async logout(userId) {
    await userRepository.setRefreshTokenHash(userId, null);
  },

  sanitizeUser,
};
