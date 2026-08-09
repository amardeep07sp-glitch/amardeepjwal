import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { createTagSchema, updateTagSchema, tagIdSchema } from './customerTag.validation.js';
import { listTags, createTag, updateTag, deleteTag } from './customerTag.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);
const canDelete = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, listTags);
router.post('/', protect, canManage, validate(createTagSchema), createTag);
router.put('/:id', protect, canManage, validate(updateTagSchema), updateTag);
router.delete('/:id', protect, canDelete, validate(tagIdSchema), deleteTag);

export default router;
