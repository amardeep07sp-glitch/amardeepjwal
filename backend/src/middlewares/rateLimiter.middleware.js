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
