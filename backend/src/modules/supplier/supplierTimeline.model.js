import mongoose from 'mongoose';
import { SUPPLIER_TIMELINE_EVENTS } from './supplier.constants.js';

// Supplier-facing milestone feed - append-only, same structural immutability
// convention as OrderTimeline/CustomerTimeline (no update/delete repository
// methods).
const supplierTimelineSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    event: { type: String, enum: Object.values(SUPPLIER_TIMELINE_EVENTS), required: true },
    note: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const SupplierTimeline = mongoose.model('SupplierTimeline', supplierTimelineSchema);
