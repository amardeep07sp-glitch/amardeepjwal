import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { OAuth2Client } from 'google-auth-library';
import { ApiError } from '../../utils/ApiError.js';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
} from '../../utils/generateTokens.js';
import { userRepository } from './auth.repository.js';
import { registrationOtpRepository } from './registrationOtp.repository.js';
import { storefrontService } from '../storefront/storefront.service.js';
import { notificationSender } from '../shared/notification.sender.js';
import { env } from '../../config/env.js';
import { logger } from '../../config/logger.js';

// Constructed even with an empty GOOGLE_CLIENT_ID - verifyIdToken() itself
// is what fails (loudly, per-request) once actually called with no
// audience configured, matching this codebase's "unset key -> the feature
// degrades/errors when used, the app never fails to boot" convention (see
// razorpay.service.js).
const googleClient = new OAuth2Client(env.GOOGLE_CLIENT_ID);

const RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes - short-lived on purpose
const hashResetToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

// Signup email verification - mobile number, then email, then a 6-digit
// code emailed to that address, then name+password (see AuthPage.jsx's
// multi-step SignUpForm). Only email gets an OTP: this store has no SMS/
// WhatsApp OTP provider configured (see apikey.todo) - phone is collected
// as a real contact field, not verified at signup, same as it always was.
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const MAX_OTP_ATTEMPTS = 5;
const hashOtp = (otp) => crypto.createHash('sha256').update(otp).digest('hex');
const generateOtp = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');

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

async function assertNotAlreadyRegistered(email, phone) {
  const [byEmail, byPhone] = await Promise.all([userRepository.findByEmail(email), userRepository.findByPhone(phone)]);
  if (byEmail) throw new ApiError(409, 'An account with this email already exists. Please log in instead.');
  if (byPhone) throw new ApiError(409, 'An account with this mobile number already exists. Please log in instead.');
}

async function sendRegistrationOtpEmail(email, phone) {
  const otp = generateOtp();
  await registrationOtpRepository.upsert(email, {
    phone,
    otpHash: hashOtp(otp),
    otpExpires: new Date(Date.now() + OTP_TTL_MS),
  });

  const result = await notificationSender.sendEmail(
    email,
    'Your verification code',
    `<p>Your verification code is:</p>
     <p style="font-size:28px;font-weight:700;letter-spacing:4px;">${otp}</p>
     <p>This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>`
  );
  // Unlike password reset's silent-always-succeed contract (that one
  // guards against email enumeration), there's no such concern here - the
  // visitor already told us this email themselves, on this same signup
  // form. If the email genuinely can't be sent, they have no way to
  // continue, so this surfaces as a real error instead of a fake success.
  if (!result.sent) {
    logger.warn({ email, reason: result.reason }, 'Registration OTP email not sent (RESEND_API_KEY likely unset - see apikey.todo)');
    throw new ApiError(503, 'Could not send the verification email right now. Please try again in a moment.');
  }
}

export const authService = {
  // Step 1+2 of signup (mobile, then email) - collects both, emails a
  // fresh OTP. Re-callable for the same email (e.g. the visitor mistyped
  // and corrected it) - upsert replaces any still-pending attempt.
  async startRegistration({ phone, email }) {
    await assertNotAlreadyRegistered(email, phone);
    await sendRegistrationOtpEmail(email, phone);
  },

  // "Resend code" on the OTP step - the pending attempt must already
  // exist (started via startRegistration); this doesn't accept a new
  // phone number, only re-sends to the same email.
  async resendRegistrationOtp(email) {
    const pending = await registrationOtpRepository.findByEmail(email);
    if (!pending) throw new ApiError(400, 'Your verification session has expired. Please start over.');
    await assertNotAlreadyRegistered(email, pending.phone);
    await sendRegistrationOtpEmail(email, pending.phone);
  },

  // Final step - real OTP check, then the actual account gets created.
  // Nothing about this account exists anywhere until this call succeeds.
  async completeRegistration({ email, otp, name, password }) {
    const pending = await registrationOtpRepository.findByEmail(email);
    if (!pending || pending.otpExpires < new Date()) {
      throw new ApiError(400, 'This code has expired. Please request a new one.');
    }
    if (pending.attempts >= MAX_OTP_ATTEMPTS) {
      throw new ApiError(429, 'Too many incorrect attempts. Please request a new code.');
    }
    if (hashOtp(otp) !== pending.otpHash) {
      await registrationOtpRepository.incrementAttempts(email);
      throw new ApiError(400, 'Incorrect code. Please try again.');
    }

    // Re-checked here, not just at step 1 - someone else could have
    // registered this exact email/phone in the minutes since (a genuine
    // race, however rare) while this OTP sat unused.
    await assertNotAlreadyRegistered(email, pending.phone);

    const user = await userRepository.create({ name, email, phone: pending.phone, password });
    await registrationOtpRepository.deleteByEmail(email);
    await storefrontService.resolveCustomer(user);
    const tokens = await issueTokens(user);

    return { user: sanitizeUser(user), ...tokens };
  },

  async login(identifier, password) {
    const isEmail = identifier.includes('@');
    const user = isEmail
      ? await userRepository.findByEmail(identifier, { withPassword: true })
      : await userRepository.findByPhone(identifier, { withPassword: true });

    // A Google-only account (no password set) must fail the same generic
    // way as a wrong password, not throw on the bcrypt.compare call below
    // (comparePassword() would be comparing against `undefined`) or leak
    // "this account only has Google sign-in" to an unauthenticated caller.
    if (!user || !user.password || !(await user.comparePassword(password))) {
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

  // "Sign in with Google" - one endpoint handles both signup and login,
  // matching how Google's own button behaves (it doesn't ask the visitor
  // which they mean). The ID token itself is Google's proof of identity;
  // this never trusts anything about the account except what
  // verifyIdToken() returns.
  async loginWithGoogle(idToken) {
    if (!env.GOOGLE_CLIENT_ID) {
      throw new ApiError(503, 'Google sign-in is not configured on this server yet');
    }

    let payload;
    try {
      const ticket = await googleClient.verifyIdToken({ idToken, audience: env.GOOGLE_CLIENT_ID });
      payload = ticket.getPayload();
    } catch {
      throw new ApiError(401, 'Google sign-in failed - invalid or expired token');
    }

    if (!payload?.email_verified) {
      throw new ApiError(401, 'Your Google account email is not verified');
    }

    let user = await userRepository.findByGoogleId(payload.sub);

    if (!user) {
      const existingByEmail = await userRepository.findByEmail(payload.email);
      if (existingByEmail) {
        // A returning customer who first signed up with a password, now
        // using "Continue with Google" for the first time - link the
        // account rather than creating a second, duplicate-email one
        // (email already has a unique index, so a duplicate is impossible
        // anyway, but linking is the actually-useful behavior here).
        user = await userRepository.linkGoogleId(existingByEmail._id, payload.sub);
      } else {
        user = await userRepository.create({
          name: payload.name || payload.email.split('@')[0],
          email: payload.email,
          authProvider: 'google',
          googleId: payload.sub,
        });
      }
    }

    if (!user.isActive) {
      throw new ApiError(403, 'This account has been deactivated');
    }

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

  // Worst-case-safe by design: whether or not `email` actually belongs to
  // an account, this always resolves the same way and never throws - an
  // attacker probing for registered emails learns nothing from the
  // response, and a real customer with a typo'd email just sees the same
  // "check your inbox" message as one who got it right. The email itself
  // (notificationSender.sendEmail) never throws either, so a Resend outage
  // degrades to "no email arrives", never a 500 on this endpoint.
  async requestPasswordReset(email) {
    const user = await userRepository.findByEmail(email);
    if (!user) return;

    const token = crypto.randomBytes(32).toString('hex');
    await userRepository.setResetToken(user._id, {
      tokenHash: hashResetToken(token),
      expires: new Date(Date.now() + RESET_TOKEN_TTL_MS),
    });

    const resetUrl = `${env.SITE_URL}/reset-password?email=${encodeURIComponent(email)}&token=${token}`;
    const result = await notificationSender.sendEmail(
      email,
      'Reset your password',
      `<p>Hello ${user.name},</p>
       <p>We received a request to reset your password. This link expires in 30 minutes and can only be used once:</p>
       <p><a href="${resetUrl}">${resetUrl}</a></p>
       <p>If you didn't request this, you can safely ignore this email - your password won't change.</p>`
    );
    if (!result.sent) {
      logger.warn({ email, reason: result.reason }, 'Password reset email not sent (RESEND_API_KEY likely unset - see apikey.todo)');
    }
  },

  async resetPassword({ email, token, newPassword }) {
    const user = await userRepository.findByEmailWithResetToken(email);
    const invalid = !user || !user.resetPasswordTokenHash || !user.resetPasswordExpires || user.resetPasswordExpires < new Date();
    // Constant-shape check even when there's no row/token to compare
    // against, so a nonexistent email and a wrong/expired token both fail
    // with the exact same generic error - never "no such account" vs
    // "wrong code", which would leak which emails are registered.
    const tokenMatches = !invalid && hashResetToken(token) === user.resetPasswordTokenHash;
    if (invalid || !tokenMatches) {
      throw new ApiError(400, 'This reset link is invalid or has expired. Please request a new one.');
    }

    await userRepository.clearResetTokenAndSetPassword(user._id, newPassword);
  },

  // Backs the support module's Assignment Rules agent-picker (Phase 25) -
  // reuses findPaginatedByRole's own documented intent ("reusable if a
  // Staff directory is ever needed too") rather than a new query.
  async listStaffUsers({ role, page, limit, search }) {
    const { items, total } = await userRepository.findPaginatedByRole({ role, page, limit, search });
    return { items: items.map(sanitizeUser), total };
  },

  sanitizeUser,
};
