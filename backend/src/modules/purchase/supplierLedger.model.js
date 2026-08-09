import mongoose from 'mongoose';
import { SUPPLIER_LEDGER_TYPES } from './purchase.constants.js';

// Immutable, append-only - "Every purchase/payment/return creates
// immutable ledger entries. Never edit historical records." (Phase 9 spec).
// Exact same structural convention as InventoryMovement/OrderTimeline: no
// update/delete repository methods exist for this collection, anywhere.
const supplierLedgerSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    type: { type: String, enum: Object.values(SUPPLIER_LEDGER_TYPES), required: true },
    // Signed - positive increases what we owe the supplier (purchase),
    // negative decreases it (payment, return, a credit adjustment).
    amount: { type: Number, required: true },
    balanceAfter: { type: Number, required: true },
    reason: { type: String, trim: true, default: '' },
    referenceType: { type: String, trim: true, default: '' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

supplierLedgerSchema.index({ supplier: 1, createdAt: -1 });

export const SupplierLedger = mongoose.model('SupplierLedger', supplierLedgerSchema);
