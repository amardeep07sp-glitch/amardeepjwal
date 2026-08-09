import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  createWarehouseSchema,
  updateWarehouseSchema,
  warehouseIdSchema,
  listWarehousesQuerySchema,
  bulkWarehouseStatusSchema,
} from './warehouse.validation.js';
import {
  listWarehouses,
  listAllWarehouses,
  getWarehouseById,
  createWarehouse,
  updateWarehouse,
  setDefaultWarehouse,
  deleteWarehouse,
  bulkUpdateWarehouseStatus,
} from './warehouse.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const manageWarehouses = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listWarehousesQuerySchema), listWarehouses);
router.get('/all', protect, canView, listAllWarehouses);
router.post('/', protect, manageWarehouses, validate(createWarehouseSchema), createWarehouse);
router.patch('/bulk-status', protect, manageWarehouses, validate(bulkWarehouseStatusSchema), bulkUpdateWarehouseStatus);

router.get('/:id', protect, canView, validate(warehouseIdSchema), getWarehouseById);
router.put('/:id', protect, manageWarehouses, validate(updateWarehouseSchema), updateWarehouse);
router.patch('/:id/set-default', protect, manageWarehouses, validate(warehouseIdSchema), setDefaultWarehouse);
router.delete('/:id', protect, manageWarehouses, validate(warehouseIdSchema), deleteWarehouse);

export default router;
