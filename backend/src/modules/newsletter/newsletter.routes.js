import { Router } from 'express';
import { validate } from '../../middlewares/validate.middleware.js';
import { supportCreateLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { subscribeNewsletterSchema } from './newsletter.validation.js';
import { subscribeNewsletter } from './newsletter.controller.js';

const router = Router();

router.post('/subscribe', supportCreateLimiter, validate(subscribeNewsletterSchema), subscribeNewsletter);

export default router;
