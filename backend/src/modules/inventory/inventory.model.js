import mongoose from 'mongoose';
import { STOCK_STATUSES } from './inventory.constants.js';

// THE Inventory record for one sellable unit (a simple product, or one
// variant of a product) in one warehouse. Never embeds Product/Variant data
// - only references. Every quantity field here must ONLY ever be changed by
// inventoryLedger.service.js#recordMovement() inside a transaction that also
// writes the matching InventoryMovement row - see that file for why.
const inventorySchema = new mongoose.Schema(
  {
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    // null for a simple (non-variant) product's own inventory record.
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null, index: true },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },
    sku: { type: String, trim: true, uppercase: true, index: true },
    barcode: { type: mongoose.Schema.Types.ObjectId, ref: 'Barcode', default: null },

    availableQuantity: { type: Number, default: 0, min: 0 },
    reservedQuantity: { type: Number, default: 0, min: 0 },
    damagedQuantity: { type: Number, default: 0, min: 0 },
    returnedQuantity: { type: Number, default: 0, min: 0 },
    incomingQuantity: { type: Number, default: 0, min: 0 },

    minimumStock: { type: Number, default: 0, min: 0 },
    maximumStock: { type: Number, default: 0, min: 0 },
    reorderLevel: { type: Number, default: 0, min: 0 },

    stockStatus: {
      type: String,
      enum: Object.values(STOCK_STATUSES),
      default: STOCK_STATUSES.OUT_OF_STOCK,
      index: true,
    },
    active: { type: Boolean, default: true },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

// One inventory record per (product, variant, warehouse) triple - variant
// null is a valid, distinct value for simple products (Mongo treats null as
// an indexable value like any other for a compound unique index, so a
// product can't accidentally get two "simple product" inventory rows in the
// same warehouse either).
inventorySchema.index({ product: 1, variant: 1, warehouse: 1 }, { unique: true });

export const Inventory = mongoose.model('Inventory', inventorySchema);
