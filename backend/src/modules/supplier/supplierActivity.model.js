import mongoose from 'mongoose';

// Internal audit feed - who did what, old value -> new value, why, and from
// where. Append-only, distinct from the generic cross-module ActivityLog
// (see supplier.audit.js) - carries the same IP/UA/old-new fields
// Order/Customer's own Activity collections do.
const supplierActivitySchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    action: { type: String, required: true, trim: true },
    oldValue: { type: mongoose.Schema.Types.Mixed, default: null },
    newValue: { type: mongoose.Schema.Types.Mixed, default: null },
    reason: { type: String, trim: true, default: '' },
    ipAddress: { type: String, trim: true, default: '' },
    userAgent: { type: String, trim: true, default: '' },
    performedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SupplierActivity = mongoose.model('SupplierActivity', supplierActivitySchema);
