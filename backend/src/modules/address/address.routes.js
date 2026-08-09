import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createAddressSchema,
  updateAddressSchema,
  addressIdSchema,
  customerIdParamSchema,
} from './address.validation.js';
import {
  listAddressesForCustomer,
  getAddressById,
  createAddress,
  updateAddress,
  deleteAddress,
} from './address.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const manageAddresses = authorize(...PRIVILEGED_ROLES);

router.get('/customer/:customerId', protect, canView, validate(customerIdParamSchema), listAddressesForCustomer);
router.post('/', protect, manageAddresses, validate(createAddressSchema), createAddress);

router.get('/:id', protect, canView, validate(addressIdSchema), getAddressById);
router.put('/:id', protect, manageAddresses, validate(updateAddressSchema), updateAddress);
router.delete('/:id', protect, manageAddresses, validate(addressIdSchema), deleteAddress);

export default router;
