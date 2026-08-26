import mongoose from 'mongoose';
import {
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  FULFILLMENT_STATUSES,
  PAYMENT_METHODS,
  ORDER_SOURCES,
} from './order.constants.js';

// Embedded, immutable copy of an Address document resolved once at
// confirm-time (order.service.js#confirmOrder) - editing or deleting the
// live Address afterward can never alter a placed order. Same snapshot
// philosophy as OrderItem's productSnapshot/variantSnapshot.
const addressSnapshotSchema = new mongoose.Schema(
  {
    label: { type: String, default: '' },
    line1: { type: String, default: '' },
    line2: { type: String, default: '' },
    city: { type: String, default: '' },
    state: { type: String, default: '' },
    postalCode: { type: String, default: '' },
    country: { type: String, default: '' },
    phone: { type: String, default: '' },
  },
  { _id: false }
);

// Same immutable-snapshot philosophy, for the customer's own name/phone/
// email - per Phase 8's explicit architecture lock: "CRM stays the live
// source of truth; Orders keep a point-in-time snapshot so historical
// orders are never affected by a later profile edit." Resolved once,
// alongside the address snapshots, in order.service.js#confirmOrder.
const customerSnapshotSchema = new mongoose.Schema(
  {
    name: { type: String, default: '' },
    phone: { type: String, default: '' },
    email: { type: String, default: '' },
  },
  { _id: false }
);

// Same immutable-snapshot philosophy, for the coupon rule that actually
// applied - a later admin edit to the coupon's discountValue/rules (or
// even deleting it) must never change what an already-placed order shows
// or was actually charged. `couponCode`/`couponDiscount` (below) stay as
// the flat scalars the rest of order.service.js's totals math already
// reads; this is the richer, redundant record for history/receipts.
const promotionSnapshotSchema = new mongoose.Schema(
  {
    couponId: { type: mongoose.Schema.Types.ObjectId, ref: 'Coupon', default: null },
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null },
    code: { type: String, default: '' },
    discountType: { type: String, default: '' },
    discountValue: { type: Number, default: 0 },
    discountBase: { type: String, default: '' },
    discountAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

const orderSchema = new mongoose.Schema(
  {
    orderNumber: { type: String, required: true, unique: true, index: true },
    // Ref target migrated from User to Customer in Phase 8 - see
    // customer.model.js's header comment for why they're separate
    // collections. customerSnapshot (below) is what keeps this order's
    // display immune to later edits on the live Customer record.
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    customerSnapshot: { type: customerSnapshotSchema, default: null },

    billingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
    shippingAddress: { type: mongoose.Schema.Types.ObjectId, ref: 'Address', default: null },
    billingAddressSnapshot: { type: addressSnapshotSchema, default: null },
    shippingAddressSnapshot: { type: addressSnapshotSchema, default: null },

    // Chosen at order-creation time (multi-warehouse fulfillment already
    // exists for real as of Phase 6) - confirmOrder reserves stock from
    // this specific warehouse's Inventory record for every line item.
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', default: null, index: true },

    currency: { type: String, trim: true, default: 'INR' },
    subtotal: { type: Number, min: 0, default: 0 },
    discount: { type: Number, min: 0, default: 0 },
    couponCode: { type: String, trim: true, uppercase: true, default: null },
    couponDiscount: { type: Number, min: 0, default: 0 },
    promotionSnapshot: { type: promotionSnapshotSchema, default: null },
    tax: { type: Number, min: 0, default: 0 },
    shippingCharge: { type: Number, min: 0, default: 0 },
    handlingCharge: { type: Number, min: 0, default: 0 },
    grandTotal: { type: Number, min: 0, default: 0 },

    paymentStatus: { type: String, enum: Object.values(PAYMENT_STATUSES), default: PAYMENT_STATUSES.PENDING, index: true },
    orderStatus: { type: String, enum: Object.values(ORDER_STATUSES), default: ORDER_STATUSES.DRAFT, index: true },
    fulfillmentStatus: {
      type: String,
      enum: Object.values(FULFILLMENT_STATUSES),
      default: FULFILLMENT_STATUSES.UNFULFILLED,
    },
    paymentMethod: { type: String, enum: Object.values(PAYMENT_METHODS), default: null },

    notes: { type: String, trim: true, default: '' },
    internalNotes: { type: String, trim: true, default: '' },
    source: { type: String, enum: Object.values(ORDER_SOURCES), default: ORDER_SOURCES.ADMIN, index: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

orderSchema.index({ createdAt: -1 });
orderSchema.index({ customer: 1, createdAt: -1 });

export const Order = mongoose.model('Order', orderSchema);
