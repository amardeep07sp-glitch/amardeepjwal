import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createAttributeValueSchema,
  updateAttributeValueSchema,
  attributeValueIdSchema,
  listAttributeValuesQuerySchema,
  attributeIdQuerySchema,
} from './attributeValue.validation.js';
import {
  listAttributeValues,
  listAttributeValuesByAttribute,
  getAttributeValueById,
  createAttributeValue,
  updateAttributeValue,
  deleteAttributeValue,
} from './attributeValue.controller.js';

const router = Router();
const manageCatalog = authorize(...PRIVILEGED_ROLES);

router.get('/by-attribute/:attributeId', protect, validate(attributeIdQuerySchema), listAttributeValuesByAttribute);
router.get('/', protect, validate(listAttributeValuesQuerySchema), listAttributeValues);
router.post('/', protect, manageCatalog, validate(createAttributeValueSchema), createAttributeValue);

router.get('/:id', protect, validate(attributeValueIdSchema), getAttributeValueById);
router.put('/:id', protect, manageCatalog, validate(updateAttributeValueSchema), updateAttributeValue);
router.delete('/:id', protect, manageCatalog, validate(attributeValueIdSchema), deleteAttributeValue);

export default router;
