import rateLimit from 'express-rate-limit';

export const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many requests, please try again later.' },
});

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many attempts, please try again later.' },
});

// Support/issue/feedback/review-report creation - the general apiLimiter
// (300/15min) already covers every authenticated route, but that ceiling
// is far too generous for content-creation endpoints specifically (Phase
// 54's abuse-prevention ask): a buggy or malicious client could still
// flood the ticket/issue/feedback queues near that limit. A tighter,
// dedicated ceiling here doesn't replace apiLimiter, it stacks under it.
export const supportCreateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many submissions, please try again later.' },
});

// CIP's public event-ingestion endpoint - "High-volume event ingestion"
// (Phase 12 Performance section) needs a ceiling suited to a single page
// load firing several events, not the 300-per-15-minutes ceiling every
// authenticated admin route shares. Mounted ahead of apiLimiter in app.js
// so this is the ONLY limiter that ever applies to it.
export const eventLimiter = rateLimit({
  windowMs: 60 * 1000,
  limit: 120,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many events, please slow down.' },
});

// A broadcast fans a single request out to every customer on email +
// WhatsApp at once - the general apiLimiter ceiling (300/15min) is far too
// generous for an action this expensive/high-blast-radius. A tight,
// dedicated ceiling here (not a replacement for apiLimiter, stacks under
// it) makes it hard to accidentally (or maliciously, from a compromised
// admin session) spam the entire customer base.
// Signup OTP send/resend - each call sends a real email, so this needs a
// much tighter ceiling than authLimiter's general 20/15min (which still
// covers login/reset attempts on this same router) - otherwise a scripted
// loop could cheaply spam an inbox or burn through the Resend quota.
export const otpLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many code requests, please try again later.' },
});

export const broadcastLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, statusCode: 429, message: 'Too many broadcasts sent recently, please try again later.' },
});
