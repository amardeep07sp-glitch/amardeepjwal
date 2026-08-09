import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createBannerSchema, updateBannerSchema, bannerIdSchema, publicBannerQuerySchema } from './banner.validation.js';
import { listBanners, createBanner, updateBanner, deleteBanner, getPublicBanners } from './banner.controller.js';

const router = Router();
const manageCms = authorize(...PRIVILEGED_ROLES);

// --- Public storefront route - deliberately unauthenticated. ---
router.get('/public', validate(publicBannerQuerySchema), getPublicBanners);

router.get('/', protect, listBanners);
router.post('/', protect, manageCms, validate(createBannerSchema), createBanner);
router.patch('/:id', protect, manageCms, validate(updateBannerSchema), updateBanner);
router.delete('/:id', protect, manageCms, validate(bannerIdSchema), deleteBanner);

export default router;
