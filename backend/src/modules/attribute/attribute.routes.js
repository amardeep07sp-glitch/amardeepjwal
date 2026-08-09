import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createAttributeSchema,
  updateAttributeSchema,
  attributeIdSchema,
  listAttributesQuerySchema,
} from './attribute.validation.js';
import {
  listAttributes,
  listAllAttributes,
  getAttributeById,
  createAttribute,
  updateAttribute,
  deleteAttribute,
} from './attribute.controller.js';

const router = Router();
const manageCatalog = authorize(...PRIVILEGED_ROLES);

router.get('/all', protect, listAllAttributes);
router.get('/', protect, validate(listAttributesQuerySchema), listAttributes);
router.post('/', protect, manageCatalog, validate(createAttributeSchema), createAttribute);

router.get('/:id', protect, validate(attributeIdSchema), getAttributeById);
router.put('/:id', protect, manageCatalog, validate(updateAttributeSchema), updateAttribute);
router.delete('/:id', protect, manageCatalog, validate(attributeIdSchema), deleteAttribute);

export default router;
