import mongoose from 'mongoose';
import { PURCHASE_RETURN_STATUSES, PURCHASE_RETURN_ACTIONS } from './purchase.constants.js';

const returnLineSchema = new mongoose.Schema(
  {
    purchaseItem: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseItem', required: true },
    quantity: { type: Number, required: true, min: 1 },
  },
  { _id: false }
);

const purchaseReturnSchema = new mongoose.Schema(
  {
    returnNumber: { type: String, required: true, unique: true, index: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', required: true, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    items: { type: [returnLineSchema], default: [] },
    reason: { type: String, trim: true, default: '' },
    action: { type: String, enum: Object.values(PURCHASE_RETURN_ACTIONS), required: true },
    status: { type: String, enum: Object.values(PURCHASE_RETURN_STATUSES), default: PURCHASE_RETURN_STATUSES.REQUESTED, index: true },
    // Value of the returned goods (sum of quantity * unitCost at the time
    // of return) - computed once at completeReturn and never
    // recalculated, same immutable-once-posted discipline as every other
    // ledger-backed amount in this module.
    amount: { type: Number, min: 0, default: 0 },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const PurchaseReturn = mongoose.model('PurchaseReturn', purchaseReturnSchema);
