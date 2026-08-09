import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import {
  createShipmentSchema,
  updateTrackingSchema,
  shipmentIdSchema,
  listShipmentsQuerySchema,
} from './orderShipment.validation.js';
import { orderIdParamSchema } from './orderPayment.validation.js';
import {
  listShipments,
  listShipmentsForOrder,
  createShipment,
  updateTracking,
  markShipmentDelivered,
} from './orderShipment.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.get('/', protect, canView, validate(listShipmentsQuerySchema), listShipments);
router.get('/order/:orderId', protect, canView, validate(orderIdParamSchema), listShipmentsForOrder);
router.post('/order/:orderId', protect, canManage, validate(createShipmentSchema), createShipment);

router.put('/:id', protect, canManage, validate(updateTrackingSchema), updateTracking);
router.patch('/:id/deliver', protect, canManage, validate(shipmentIdSchema), markShipmentDelivered);

export default router;
