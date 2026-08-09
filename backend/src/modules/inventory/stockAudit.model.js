import mongoose from 'mongoose';
import { AUDIT_STATUSES } from './inventory.constants.js';

const stockAuditSchema = new mongoose.Schema(
  {
    inventory: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true, index: true },
    countedQuantity: { type: Number, required: true, min: 0 },
    // Snapshot of availableQuantity at the moment the audit was created, not
    // read again at completion time - a movement that happens mid-audit
    // shouldn't silently change what "the difference" means.
    systemQuantity: { type: Number, required: true },
    difference: { type: Number, required: true },
    status: { type: String, enum: Object.values(AUDIT_STATUSES), default: AUDIT_STATUSES.DRAFT, index: true },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

export const StockAudit = mongoose.model('StockAudit', stockAuditSchema);
