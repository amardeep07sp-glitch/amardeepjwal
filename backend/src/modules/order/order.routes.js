import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import {
  createOrderSchema,
  orderIdSchema,
  listOrdersQuerySchema,
  cancelOrderSchema,
  itemIdsBodySchema,
  barcodeValueParamSchema,
  exportOrdersQuerySchema,
} from './order.validation.js';
import {
  listOrders,
  getOrderById,
  getOrderTimeline,
  getOrderActivity,
  lookupByBarcode,
  createOrder,
  submitOrder,
  confirmOrder,
  cancelOrder,
  packOrder,
  markReadyToShip,
  markDelivered,
  completeOrder,
  getDashboardTotals,
  getSalesTrend,
  getStatusDistribution,
  getPaymentBreakdown,
  exportOrders,
} from './order.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Staff run POS and need to drive an order end-to-end (create/confirm/pack/
// ship/deliver) without a Manager present - Cancel/Refund stay one notch
// more restricted (PRIVILEGED_ROLES only, see canCancelOrRefund below).
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);
const canCancelOrRefund = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listOrdersQuerySchema), listOrders);
router.post('/', protect, canManage, validate(createOrderSchema), createOrder);

router.get('/dashboard-totals', protect, canView, getDashboardTotals);
router.get('/sales-trend', protect, canView, getSalesTrend);
router.get('/status-distribution', protect, canView, getStatusDistribution);
router.get('/payment-breakdown', protect, canView, getPaymentBreakdown);
router.get('/lookup-by-barcode/:value', protect, canManage, validate(barcodeValueParamSchema), lookupByBarcode);
router.get('/export', protect, canView, validate(exportOrdersQuerySchema), exportOrders);

router.get('/:id', protect, canView, validate(orderIdSchema), getOrderById);
router.get('/:id/timeline', protect, canView, validate(orderIdSchema), getOrderTimeline);
router.get('/:id/activity', protect, canView, validate(orderIdSchema), getOrderActivity);

router.patch('/:id/submit', protect, canManage, validate(orderIdSchema), submitOrder);
router.patch('/:id/confirm', protect, canManage, validate(orderIdSchema), confirmOrder);
router.patch('/:id/cancel', protect, canCancelOrRefund, validate(cancelOrderSchema), cancelOrder);
router.patch('/:id/pack', protect, canManage, validate(itemIdsBodySchema), packOrder);
router.patch('/:id/ready-to-ship', protect, canManage, validate(orderIdSchema), markReadyToShip);
router.patch('/:id/deliver', protect, canManage, validate(itemIdsBodySchema), markDelivered);
router.patch('/:id/complete', protect, canManage, validate(orderIdSchema), completeOrder);

export default router;
