import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { broadcastLimiter } from '../../middlewares/rateLimiter.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createBroadcastSchema, broadcastIdSchema, listBroadcastsQuerySchema } from './broadcast.validation.js';
import { createBroadcast, listBroadcasts, getBroadcastById, deactivateBroadcast, getActiveWebsiteBroadcasts } from './broadcast.controller.js';

const router = Router();
const canManage = authorize(...PRIVILEGED_ROLES);

// Public, unauthenticated - every storefront visitor (logged in or not)
// needs to see active site-wide announcements, same as banners/navbar.
router.get('/active', getActiveWebsiteBroadcasts);

router.get('/', protect, canManage, validate(listBroadcastsQuerySchema), listBroadcasts);
router.post('/', protect, canManage, broadcastLimiter, validate(createBroadcastSchema), createBroadcast);
router.get('/:id', protect, canManage, validate(broadcastIdSchema), getBroadcastById);
router.patch('/:id/deactivate', protect, canManage, validate(broadcastIdSchema), deactivateBroadcast);

export default router;
