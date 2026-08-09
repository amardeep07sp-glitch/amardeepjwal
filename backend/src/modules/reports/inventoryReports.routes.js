import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES } from '../../constants/roles.js';
import { inventoryStockQuerySchema, inventoryValuationQuerySchema, stockMovementQuerySchema, velocityQuerySchema } from './inventoryReports.validation.js';
import {
  getCurrentStock,
  getLowStock,
  getOutOfStock,
  getInventoryValuation,
  getStockMovement,
  getInventoryAging,
  getFastMoving,
  getSlowMoving,
  getDeadStock,
} from './inventoryReports.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);

router.get('/current-stock', protect, canView, validate(inventoryStockQuerySchema), getCurrentStock);
router.get('/low-stock', protect, canView, validate(inventoryStockQuerySchema), getLowStock);
router.get('/out-of-stock', protect, canView, validate(inventoryStockQuerySchema), getOutOfStock);
router.get('/valuation', protect, canView, validate(inventoryValuationQuerySchema), getInventoryValuation);
router.get('/movement', protect, canView, validate(stockMovementQuerySchema), getStockMovement);
router.get('/aging', protect, canView, validate(inventoryValuationQuerySchema), getInventoryAging);
router.get('/fast-moving', protect, canView, validate(velocityQuerySchema), getFastMoving);
router.get('/slow-moving', protect, canView, validate(velocityQuerySchema), getSlowMoving);
router.get('/dead-stock', protect, canView, validate(velocityQuerySchema), getDeadStock);

export default router;
