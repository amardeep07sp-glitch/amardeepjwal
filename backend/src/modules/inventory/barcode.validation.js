import { z } from 'zod';
import { BARCODE_TYPES, BARCODE_STATUSES } from './inventory.constants.js';

const scopeBody = z.object({
  productId: z.string().optional().nullable(),
  variantId: z.string().optional().nullable(),
  barcodeType: z.enum(Object.values(BARCODE_TYPES)),
});

export const generateBarcodeSchema = z.object({
  body: scopeBody.extend({ manualValue: z.string().optional() }),
});

export const regenerateBarcodeSchema = z.object({ body: scopeBody });

export const barcodeIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listBarcodesQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(BARCODE_STATUSES)).optional(),
    barcodeType: z.enum(Object.values(BARCODE_TYPES)).optional(),
    search: z.string().optional(),
  }),
});
