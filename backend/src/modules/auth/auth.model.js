import mongoose from 'mongoose';
import bcrypt from 'bcrypt';
import { ROLE_VALUES, ROLES } from '../../constants/roles.js';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, trim: true, unique: true, sparse: true },
    // Optional for a Google-only account (see auth.service.js#loginWithGoogle)
    // - required stays enforced for every normal 'local' signup via this
    // conditional rather than dropping the constraint globally.
    password: {
      type: String,
      required: [function requiresPassword() { return this.authProvider === 'local'; }, 'Password is required'],
      select: false,
      minlength: 8,
    },
    authProvider: { type: String, enum: ['local', 'google'], default: 'local' },
    // Google's stable per-account subject id ('sub' claim) - the real
    // identity link, never re-derived from email alone (an email can
    // change on Google's side; this can't). Sparse+unique so only accounts
    // that actually signed in with Google ever occupy a slot in the index -
    // deliberately NO `default: null` here: Mongoose would then write an
    // explicit `null` onto every plain-password signup, and MongoDB's
    // sparse index treats an explicit null as a present, indexed value
    // (only a genuinely absent/undefined field is skipped) - so the
    // SECOND local signup ever created would collide with the first one's
    // `googleId: null` and fail with a duplicate-key error. Omitting the
    // field entirely for local accounts is what keeps them out of the
    // index, which is the whole point of "sparse".
    googleId: { type: String, index: true, sparse: true, unique: true },
    role: { type: String, enum: ROLE_VALUES, default: ROLES.CUSTOMER },
    isActive: { type: Boolean, default: true },
    refreshTokenHash: { type: String, select: false, default: null },
    // Password reset (auth.service.js#requestPasswordReset/resetPassword) -
    // only ever the SHA-256 hash of the emailed token is stored, same
    // "never persist the actual secret" rule refreshTokenHash already
    // follows, so a DB read alone can never be used to reset an account.
    resetPasswordTokenHash: { type: String, select: false, default: null },
    resetPasswordExpires: { type: Date, select: false, default: null },
  },
  { timestamps: true }
);

// Cost 10 (not 12) - still well above the widely-recommended minimum (10),
// but noticeably lighter on a free/shared-CPU host (Render's free tier)
// where cost 12 was adding a real, felt delay to every login/register/
// refresh (each does one hash or compare). Halving-ish the cost roughly
// halves the CPU time per call without meaningfully weakening the hash.
userSchema.pre('save', async function hashPassword(next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 10);
  next();
});

userSchema.methods.comparePassword = function comparePassword(candidate) {
  return bcrypt.compare(candidate, this.password);
};

export const User = mongoose.model('User', userSchema);
