import mongoose from 'mongoose';
import { MOVEMENT_TYPES } from './inventory.constants.js';

// Append-only ledger. There is deliberately no updateById/deleteById on
// inventoryMovement.repository.js - the only way a row gets here is
// inventoryLedgerService.recordMovement(), and once written it is never
// touched again.
const inventoryMovementSchema = new mongoose.Schema(
  {
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true, index: true },
    variant: { type: mongoose.Schema.Types.ObjectId, ref: 'Variant', default: null },
    warehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true, index: true },

    movementType: { type: String, enum: Object.values(MOVEMENT_TYPES), required: true, index: true },
    quantityBefore: { type: Number, required: true },
    quantityChanged: { type: Number, required: true },
    quantityAfter: { type: Number, required: true },
    reason: { type: String, trim: true, default: '' },

    // Polymorphic pointer to whatever caused this movement (a
    // StockAdjustment, StockTransfer, StockAudit id, or a future
    // Order/Purchase id) - purely informational, never populated generically.
    referenceType: { type: String, trim: true, default: '' },
    referenceId: { type: mongoose.Schema.Types.ObjectId, default: null },

    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const InventoryMovement = mongoose.model('InventoryMovement', inventoryMovementSchema);
