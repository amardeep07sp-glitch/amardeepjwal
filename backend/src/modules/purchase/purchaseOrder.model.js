import mongoose from 'mongoose';
import { PO_STATUSES, PO_PAYMENT_STATUSES } from './purchase.constants.js';

// Immutable copy of the Supplier's identity fields, resolved once at
// approval-time (purchaseOrder.service.js#approvePurchaseOrder) - editing
// the live Supplier record afterward can never alter an already-approved
// PO. Exact same snapshot philosophy, at the exact same lifecycle point, as
// Order.customerSnapshot (Phase 8's architecture lock: the CRM/vendor
// master stays the live source of truth; the transactional document keeps
// a point-in-time copy).
const supplierSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    gstNumber: { type: String, default: '' },
  },
  { _id: false }
);

const purchaseOrderSchema = new mongoose.Schema(
  {
    poNumber: { type: String, required: true, unique: true, index: true },
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    supplierSnapshot: { type: supplierSnapshotSchema, default: null },

    // Receiving destination - every line item's Inventory record is scoped
    // to (product, variant, this warehouse), exactly like Order's chosen
    // warehouse scopes its reservations.
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },

    subtotal: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    shippingCharge: { type: Number, min: 0, default: 0 },
    grandTotal: { type: Number, min: 0, default: 0 },

    expectedDeliveryDate: { type: Date, default: null },
    internalNotes: { type: String, trim: true, default: '' },

    status: { type: String, enum: Object.values(PO_STATUSES), default: PO_STATUSES.DRAFT, index: true },
    // Recomputed from the sum of 'paid' SupplierPayment rows against this
    // PO vs grandTotal - the exact same rollup discipline as
    // orderPayment.service.js#recomputeOrderPaymentStatus.
    paymentStatus: { type: String, enum: Object.values(PO_PAYMENT_STATUSES), default: PO_PAYMENT_STATUSES.PENDING, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

purchaseOrderSchema.index({ createdAt: -1 });
purchaseOrderSchema.index({ supplier: 1, createdAt: -1 });

export const PurchaseOrder = mongoose.model('PurchaseOrder', purchaseOrderSchema);
