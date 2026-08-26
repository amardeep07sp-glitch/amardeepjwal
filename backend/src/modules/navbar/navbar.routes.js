import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createNavbarItemSchema, updateNavbarItemSchema, navbarItemIdSchema } from './navbar.validation.js';
import { listNavbarItems, listPublicNavbarItems, createNavbarItem, updateNavbarItem, deleteNavbarItem } from './navbar.controller.js';

const router = Router();
const manageCms = authorize(...PRIVILEGED_ROLES);

// Must come before the admin `GET /` (protect-gated) - the storefront
// header has no admin session.
router.get('/public', listPublicNavbarItems);

router.get('/', protect, listNavbarItems);
router.post('/', protect, manageCms, validate(createNavbarItemSchema), createNavbarItem);
router.patch('/:id', protect, manageCms, validate(updateNavbarItemSchema), updateNavbarItem);
router.delete('/:id', protect, manageCms, validate(navbarItemIdSchema), deleteNavbarItem);

export default router;
