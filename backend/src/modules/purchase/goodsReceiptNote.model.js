import mongoose from 'mongoose';

const grnLineSchema = new mongoose.Schema(
  {
    purchaseItem: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseItem', required: true },
    receivedQuantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

// One receipt event against a Purchase Order - immutable once created
// (an over/under-receipt correction is its own new GRN or a Purchase
// Return, never an edit to a past one). Multiple GRNs per PO is the norm,
// not an edge case - see purchaseOrder.constants.js's Partially Received
// status.
const goodsReceiptNoteSchema = new mongoose.Schema(
  {
    grnNumber: { type: String, required: true, unique: true, index: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    items: { type: [grnLineSchema], default: [] },
    notes: { type: String, trim: true, default: '' },
    receivedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const GoodsReceiptNote = mongoose.model('GoodsReceiptNote', goodsReceiptNoteSchema);
