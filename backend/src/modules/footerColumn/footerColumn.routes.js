import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createFooterColumnSchema,
  updateFooterColumnSchema,
  footerColumnIdSchema,
} from './footerColumn.validation.js';
import {
  listFooterColumns,
  listPublicFooterColumns,
  createFooterColumn,
  updateFooterColumn,
  deleteFooterColumn,
} from './footerColumn.controller.js';

const router = Router();
const manageCms = authorize(...PRIVILEGED_ROLES);

// Must come before the admin `GET /` (protect-gated) - the storefront
// Footer has no admin session.
router.get('/public', listPublicFooterColumns);

router.get('/', protect, listFooterColumns);
router.post('/', protect, manageCms, validate(createFooterColumnSchema), createFooterColumn);
router.patch('/:id', protect, manageCms, validate(updateFooterColumnSchema), updateFooterColumn);
router.delete('/:id', protect, manageCms, validate(footerColumnIdSchema), deleteFooterColumn);

export default router;
