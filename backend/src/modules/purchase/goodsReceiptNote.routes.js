import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES, ROLES } from '../../constants/roles.js';
import { receiveGoodsSchema, purchaseOrderIdParamSchema } from './goodsReceiptNote.validation.js';
import { listGrnsForPurchaseOrder, receiveGoods } from './goodsReceiptNote.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
// Staff physically receive goods at the warehouse counter.
const canManage = authorize(...PRIVILEGED_ROLES, ROLES.STAFF);

router.get('/purchase-order/:purchaseOrderId', protect, canView, validate(purchaseOrderIdParamSchema), listGrnsForPurchaseOrder);
router.post('/purchase-order/:purchaseOrderId', protect, canManage, validate(receiveGoodsSchema), receiveGoods);

export default router;
