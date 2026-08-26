import { RegistrationOtp } from './registrationOtp.model.js';

export const registrationOtpRepository = {
  // Upsert by email - a visitor re-requesting an OTP for the same email
  // (typo'd the first code, or it expired) replaces the pending attempt
  // rather than stacking a second one.
  upsert(email, { phone, otpHash, otpExpires }) {
    return RegistrationOtp.findOneAndUpdate(
      { email },
      { $set: { phone, otpHash, otpExpires, attempts: 0, createdAt: new Date() } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  },

  findByEmail(email) {
    return RegistrationOtp.findOne({ email });
  },

  incrementAttempts(email) {
    return RegistrationOtp.findOneAndUpdate({ email }, { $inc: { attempts: 1 } }, { new: true });
  },

  deleteByEmail(email) {
    return RegistrationOtp.deleteOne({ email });
  },
};
