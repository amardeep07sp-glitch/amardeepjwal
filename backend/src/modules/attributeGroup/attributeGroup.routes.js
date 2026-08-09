import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createAttributeGroupSchema,
  updateAttributeGroupSchema,
  attributeGroupIdSchema,
  listAttributeGroupsQuerySchema,
} from './attributeGroup.validation.js';
import {
  listAttributeGroups,
  listAllAttributeGroups,
  getAttributeGroupById,
  createAttributeGroup,
  updateAttributeGroup,
  deleteAttributeGroup,
} from './attributeGroup.controller.js';

const router = Router();
const manageCatalog = authorize(...PRIVILEGED_ROLES);

router.get('/all', protect, listAllAttributeGroups);
router.get('/', protect, validate(listAttributeGroupsQuerySchema), listAttributeGroups);
router.post('/', protect, manageCatalog, validate(createAttributeGroupSchema), createAttributeGroup);

router.get('/:id', protect, validate(attributeGroupIdSchema), getAttributeGroupById);
router.put('/:id', protect, manageCatalog, validate(updateAttributeGroupSchema), updateAttributeGroup);
router.delete('/:id', protect, manageCatalog, validate(attributeGroupIdSchema), deleteAttributeGroup);

export default router;
