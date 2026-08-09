import mongoose from 'mongoose';
import { PURCHASE_PAYMENT_METHODS, SUPPLIER_PAYMENT_STATUSES } from './purchase.constants.js';

// A completed outgoing payment to a supplier - unlike Order's payments,
// every method here is manual (cash/UPI/bank/cheque, no gateway), so every
// row is recorded as 'paid' immediately, same as OrderPayment's manual
// path. `purchaseOrder` is optional - a supplier can be paid against a
// specific PO or as a general account settlement.
const supplierPaymentSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    purchaseOrder: { type: mongoose.Schema.Types.ObjectId, ref: 'PurchaseOrder', default: null, index: true },
    method: { type: String, enum: Object.values(PURCHASE_PAYMENT_METHODS), required: true },
    amount: { type: Number, required: true, min: 0 },
    status: { type: String, enum: Object.values(SUPPLIER_PAYMENT_STATUSES), default: SUPPLIER_PAYMENT_STATUSES.PAID },
    transactionReference: { type: String, trim: true, default: '' },
    paidAt: { type: Date, default: null },
    recordedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const SupplierPayment = mongoose.model('SupplierPayment', supplierPaymentSchema);
