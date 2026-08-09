import mongoose from 'mongoose';
import { ADJUSTMENT_TYPES, ADJUSTMENT_STATUSES } from './inventory.constants.js';

const stockAdjustmentSchema = new mongoose.Schema(
  {
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    type: { type: String, enum: Object.values(ADJUSTMENT_TYPES), required: true },
    quantity: { type: Number, required: true, min: 1 },
    reason: { type: String, trim: true, required: true },
    status: { type: String, enum: Object.values(ADJUSTMENT_STATUSES), default: ADJUSTMENT_STATUSES.PENDING, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const StockAdjustment = mongoose.model('StockAdjustment', stockAdjustmentSchema);
