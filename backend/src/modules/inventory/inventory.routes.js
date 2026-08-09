import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import { handleInventoryCsvUpload } from './inventory.upload.middleware.js';
import {
  listInventoryQuerySchema,
  inventoryIdSchema,
  productIdParamSchema,
  ledgerQuerySchema,
  updateInventorySettingsSchema,
  reservationSchema,
} from './inventory.validation.js';
import {
  listInventory,
  getInventoryById,
  getInventoryForProduct,
  getLedger,
  getRecentMovements,
  getDashboardTotals,
  exportInventory,
  importInventorySettings,
  updateInventorySettings,
  reserveStock,
  releaseReservation,
  convertReservationToSale,
} from './inventory.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const manageStock = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listInventoryQuerySchema), listInventory);
router.get('/dashboard-totals', protect, canView, getDashboardTotals);
router.get('/recent-movements', protect, canView, getRecentMovements);
router.get('/export', protect, canView, exportInventory);
router.post('/import-settings', protect, manageStock, handleInventoryCsvUpload, importInventorySettings);
router.get('/product/:productId', protect, canView, validate(productIdParamSchema), getInventoryForProduct);

router.get('/:id', protect, canView, validate(inventoryIdSchema), getInventoryById);
router.get('/:id/ledger', protect, canView, validate(ledgerQuerySchema), getLedger);
router.put('/:id/settings', protect, manageStock, validate(updateInventorySettingsSchema), updateInventorySettings);
router.post('/:id/reserve', protect, manageStock, validate(reservationSchema), reserveStock);
router.post('/:id/release', protect, manageStock, validate(reservationSchema), releaseReservation);
router.post('/:id/convert-to-sale', protect, manageStock, validate(reservationSchema), convertReservationToSale);

export default router;
