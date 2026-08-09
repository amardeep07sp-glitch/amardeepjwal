import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createHomepageSectionSchema,
  updateHomepageSectionSchema,
  homepageSectionIdSchema,
} from './homepageSection.validation.js';
import {
  listHomepageSections,
  createHomepageSection,
  updateHomepageSection,
  deleteHomepageSection,
} from './homepageSection.controller.js';

const router = Router();
const manageCms = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, listHomepageSections);
router.post('/', protect, manageCms, validate(createHomepageSectionSchema), createHomepageSection);
router.patch('/:id', protect, manageCms, validate(updateHomepageSectionSchema), updateHomepageSection);
router.delete('/:id', protect, manageCms, validate(homepageSectionIdSchema), deleteHomepageSection);

export default router;
