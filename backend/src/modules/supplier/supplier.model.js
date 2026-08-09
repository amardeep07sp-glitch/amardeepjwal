import mongoose from 'mongoose';
import { SUPPLIER_STATUSES } from './supplier.constants.js';

const bankDetailsSchema = new mongoose.Schema(
  {
    accountHolderName: { type: String, trim: true, default: '' },
    accountNumber: { type: String, trim: true, default: '' },
    ifscCode: { type: String, trim: true, uppercase: true, default: '' },
    bankName: { type: String, trim: true, default: '' },
    branch: { type: String, trim: true, default: '' },
  },
  { _id: false }
);

// THE Supplier entity - always read live, never snapshotted (same
// architecture-lock principle Phase 8 established for Customer: "CRM/vendor
// master stays the live source of truth"). The one deliberate exception is
// PurchaseOrder.supplierSnapshot, resolved once at approval-time, exactly
// mirroring Order.customerSnapshot - see purchaseOrder.model.js.
const supplierSchema = new mongoose.Schema(
  {
    supplierCode: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    name: { type: String, required: true, trim: true },
    contactPerson: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: null },
    phone: { type: String, trim: true, default: null },

    gstNumber: { type: String, trim: true, uppercase: true, default: '' },
    panNumber: { type: String, trim: true, uppercase: true, default: '' },
    bankDetails: { type: bankDetailsSchema, default: () => ({}) },

    status: { type: String, enum: Object.values(SUPPLIER_STATUSES), default: SUPPLIER_STATUSES.ACTIVE, index: true },

    // Running amount owed to this supplier - the one field the Supplier
    // Ledger's single choke-point (supplierLedger.service.js#recordEntry)
    // is ever allowed to mutate. Unlike Wallet/Inventory this is allowed to
    // go negative (a credit balance, e.g. the supplier was overpaid or a
    // return exceeded the outstanding balance) - that is real, valid
    // accounting, not a bug.
    outstandingBalance: { type: Number, default: 0 },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// Sparse - a supplier may be known only by phone, or only by email/GST, at
// data-entry time.
supplierSchema.index({ email: 1 }, { unique: true, sparse: true });
supplierSchema.index({ phone: 1 }, { unique: true, sparse: true });
supplierSchema.index({ gstNumber: 1 }, { unique: true, sparse: true });
supplierSchema.index({ createdAt: -1 });

export const Supplier = mongoose.model('Supplier', supplierSchema);
