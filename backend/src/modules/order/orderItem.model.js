import mongoose from 'mongoose';
import { ORDER_ITEM_STATUSES } from './order.constants.js';

// Resolved once at order-creation time and never re-read from Product -
// later edits to the product's name/image/price/attributes must never
// change what a historical order shows. Same philosophy as
// order.model.js's address snapshots.
const productSnapshotSchema = new mongoose.Schema(
  { name: { type: String, default: '' }, image: { type: String, default: '' }, slug: { type: String, default: '' } },
  { _id: false }
);

const variantAttributeSnapshotSchema = new mongoose.Schema(
  { name: { type: String, default: '' }, value: { type: String, default: '' } },
  { _id: false }
);

const variantSnapshotSchema = new mongoose.Schema(
  { attributes: { type: [variantAttributeSnapshotSchema], default: [] } },
  { _id: false }
);

const orderItemSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null },
    sku: { type: String, required: true, trim: true },
    barcode: { type: mongoose.Schema.Types.ObjectId, ref: 'Barcode', default: null },

    productSnapshot: { type: productSnapshotSchema, default: () => ({}) },
    variantSnapshot: { type: variantSnapshotSchema, default: () => ({}) },

    quantity: { type: Number, required: true, min: 1 },
    unitPrice: { type: Number, required: true, min: 0 },
    discount: { type: Number, min: 0, default: 0 },
    tax: { type: Number, min: 0, default: 0 },
    subtotal: { type: Number, min: 0, default: 0 },
    total: { type: Number, min: 0, default: 0 },

    status: { type: String, enum: Object.values(ORDER_ITEM_STATUSES), default: ORDER_ITEM_STATUSES.PENDING, index: true },
  },
  { timestamps: true }
);

export const OrderItem = mongoose.model('OrderItem', orderItemSchema);
