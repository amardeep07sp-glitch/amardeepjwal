import { Router } from 'express';
import { protect, authorize } from '../../middlewares/auth.middleware.js';
import { validate } from '../../middlewares/validate.middleware.js';
import { VIEW_ROLES, PRIVILEGED_ROLES } from '../../constants/roles.js';
import {
  generateBarcodeSchema,
  regenerateBarcodeSchema,
  barcodeIdSchema,
  listBarcodesQuerySchema,
} from './barcode.validation.js';
import { listBarcodes, getBarcodeById, generateBarcode, regenerateBarcode, deleteBarcode } from './barcode.controller.js';

const router = Router();
const canView = authorize(...VIEW_ROLES);
const manageBarcodes = authorize(...PRIVILEGED_ROLES);

router.get('/', protect, canView, validate(listBarcodesQuerySchema), listBarcodes);
router.post('/generate', protect, manageBarcodes, validate(generateBarcodeSchema), generateBarcode);
router.post('/regenerate', protect, manageBarcodes, validate(regenerateBarcodeSchema), regenerateBarcode);

router.get('/:id', protect, canView, validate(barcodeIdSchema), getBarcodeById);
router.delete('/:id', protect, manageBarcodes, validate(barcodeIdSchema), deleteBarcode);

export default router;
