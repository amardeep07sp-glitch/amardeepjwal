import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { trackEventSchema } from './event.validation.js';
import { trackEvent } from './event.controller.js';

// Public, unauthenticated - deliberately mounted OUTSIDE the `protect`
// middleware everything else in this codebase requires, and (see app.js)
// outside the global apiLimiter too, with its own more generous limiter -
// "High-volume event ingestion" (Performance section) needs a ceiling
// suited to a single page load firing several events, not the 300-per-15-
// minutes ceiling every authenticated admin route shares.
const router = Router();

router.post('/track', validate(trackEventSchema), trackEvent);

export default router;
