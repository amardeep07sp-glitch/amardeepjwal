import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import { createPageSchema, updatePageSchema, pageIdSchema } from './page.validation.js';
import { listPages, createPage, updatePage, deletePage, getPublicPage } from './page.controller.js';

const router = Router();
const manageCms = authorize(...PRIVILEGED_ROLES);

// Must come before the admin `GET /` (protect-gated) - a public visitor
// hitting a CMS page has no admin session, and this is the only door a
// storefront page (client/src/pages/CmsPage.jsx) has to real page content.
router.get('/public/:slug', getPublicPage);

router.get('/', protect, listPages);
router.post('/', protect, manageCms, validate(createPageSchema), createPage);
router.patch('/:id', protect, manageCms, validate(updatePageSchema), updatePage);
router.delete('/:id', protect, manageCms, validate(pageIdSchema), deletePage);

export default router;
