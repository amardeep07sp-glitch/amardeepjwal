import mongoose from 'mongoose';

// A signup that hasn't finished yet - phone + email collected, an OTP
// emailed and waiting to be entered, name/password not collected yet.
// Deliberately its own collection, not a half-created User row: an
// abandoned attempt (closed the tab after step 2, never entered the OTP)
// must never occupy the real, unique email/phone slot a genuine later
// signup needs. The TTL index below auto-deletes a doc 20 minutes after
// creation regardless of outcome, so an abandoned attempt cleans itself up
// without a cron job.
const registrationOtpSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    phone: { type: String, required: true, trim: true },
    // SHA-256 hash only - same "never persist the actual secret" rule as
    // auth.model.js's resetPasswordTokenHash.
    otpHash: { type: String, required: true },
    otpExpires: { type: Date, required: true },
    // Wrong-code attempts against this one pending signup - capped
    // (auth.service.js#MAX_OTP_ATTEMPTS) so the 6-digit space can't just be
    // brute-forced within the OTP's own validity window.
    attempts: { type: Number, default: 0 },
    createdAt: { type: Date, default: Date.now, expires: 60 * 20 },
  },
  { timestamps: false }
);

export const RegistrationOtp = mongoose.model('RegistrationOtp', registrationOtpSchema);
