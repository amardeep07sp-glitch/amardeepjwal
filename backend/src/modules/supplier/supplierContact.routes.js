import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { createContactSchema, updateContactSchema, contactIdSchema, supplierIdParamSchema } from './supplierContact.validation.js';
import { listContacts, createContact, updateContact, deleteContact } from './supplierContact.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.get('/supplier/:supplierId', protect, canView, validate(supplierIdParamSchema), listContacts);
router.post('/supplier/:supplierId', protect, canManage, validate(createContactSchema), createContact);
router.put('/:id', protect, canManage, validate(updateContactSchema), updateContact);
router.delete('/:id', protect, canManage, validate(contactIdSchema), deleteContact);

export default router;
