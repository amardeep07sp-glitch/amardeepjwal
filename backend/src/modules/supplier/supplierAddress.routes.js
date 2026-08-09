import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { createAddressSchema, updateAddressSchema, addressIdSchema, supplierIdParamSchema } from './supplierAddress.validation.js';
import { listAddresses, createAddress, updateAddress, deleteAddress } from './supplierAddress.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.get('/supplier/:supplierId', protect, canView, validate(supplierIdParamSchema), listAddresses);
router.post('/supplier/:supplierId', protect, canManage, validate(createAddressSchema), createAddress);
router.put('/:id', protect, canManage, validate(updateAddressSchema), updateAddress);
router.delete('/:id', protect, canManage, validate(addressIdSchema), deleteAddress);

export default router;
