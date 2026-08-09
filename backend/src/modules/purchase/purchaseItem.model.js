import mongoose from 'mongoose';

// Resolved once at PO-creation time - later edits to the product's
// name/image must never change what a historical Purchase Order shows.
// Same philosophy as orderItem.model.js's productSnapshot.
const productSnapshotSchema = new mongoose.Schema(
  { name: { type: String, default: '' }, image: { type: String, default: '' } },
  { _id: false }
);

const purchaseItemSchema = new mongoose.Schema(
  {
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null },
    sku: { type: String, required: true, trim: true },
    barcode: { type: mongoose.Schema.Types.ObjectId, ref: 'Barcode', default: null },
    productSnapshot: { type: productSnapshotSchema, default: () => ({}) },

    quantity: { type: Number, required: true, min: 1 },
    // Mutated ONLY by goodsReceiptNote.service.js#receiveGoods -
    // purchaseOrder.service.js reads it but never writes it directly.
    receivedQuantity: { type: Number, default: 0, min: 0 },
    // Mutated ONLY by purchaseReturn.service.js#completeReturn.
    returnedQuantity: { type: Number, default: 0, min: 0 },
    // Denormalized for fast reads (quantity - receivedQuantity) - kept in
    // sync by the same GRN write that updates receivedQuantity, never
    // computed ad hoc, so PO_RECEIVABLE_STATUSES logic never has to
    // recompute it from scratch.
    pendingQuantity: { type: Number, default: 0, min: 0 },

    unitCost: { type: Number, required: true, min: 0 },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },
  },
  { timestamps: true }
);

export const PurchaseItem = mongoose.model('PurchaseItem', purchaseItemSchema);
