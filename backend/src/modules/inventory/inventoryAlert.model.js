import mongoose from 'mongoose';
import { ALERT_TYPES, ALERT_STATUSES } from './inventory.constants.js';

const inventoryAlertSchema = new mongoose.Schema(
  {
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    type: { type: String, enum: Object.values(ALERT_TYPES), required: true, index: true },
    message: { type: String, trim: true, required: true },
    status: { type: String, enum: Object.values(ALERT_STATUSES), default: ALERT_STATUSES.OPEN, index: true },
  },
  { timestamps: { createdAt: true, updatedAt: true } }
);

export const InventoryAlert = mongoose.model('InventoryAlert', inventoryAlertSchema);
