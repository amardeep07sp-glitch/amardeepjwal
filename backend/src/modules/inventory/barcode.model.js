import mongoose from 'mongoose';
import { BARCODE_TYPES, BARCODE_STATUSES } from './inventory.constants.js';

const barcodeSchema = new mongoose.Schema(
  {
    barcodeValue: { type: String, required: true, unique: true, trim: true },
    barcodeType: { type: String, enum: Object.values(BARCODE_TYPES), required: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', default: null, index: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null, index: true },
    status: { type: String, enum: Object.values(BARCODE_STATUSES), default: BARCODE_STATUSES.ACTIVE, index: true },
    generatedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

// "Never duplicate active barcode": at most one ACTIVE barcode can exist per
// product/variant. Old barcodes are set inactive on regeneration, never
// deleted (see barcode.service.js#regenerate and the DELETE RULES).
barcodeSchema.index(
  { product: 1, variant: 1, status: 1 },
  { unique: true, partialFilterExpression: { status: 'active' } }
);

export const Barcode = mongoose.model('Barcode', barcodeSchema);
