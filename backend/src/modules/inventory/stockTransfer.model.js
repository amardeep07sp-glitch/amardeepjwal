import mongoose from 'mongoose';
import { TRANSFER_STATUSES } from './inventory.constants.js';

const stockTransferSchema = new mongoose.Schema(
  {
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    fromWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    toWarehouse: { type: mongoose.Schema.Types.ObjectId, ref: 'Warehouse', required: true },
    quantity: { type: Number, required: true, min: 1 },
    status: { type: String, enum: Object.values(TRANSFER_STATUSES), default: TRANSFER_STATUSES.REQUESTED, index: true },
    requestedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    approvedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    completedAt: { type: Date, default: null },
  },
  { timestamps: true }
);

export const StockTransfer = mongoose.model('StockTransfer', stockTransferSchema);
