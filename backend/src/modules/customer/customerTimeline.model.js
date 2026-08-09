import mongoose from 'mongoose';
import { CUSTOMER_TIMELINE_EVENTS } from './customer.constants.js';

// Customer-facing milestone feed - append-only, same structural
// immutability convention as OrderTimeline/InventoryMovement.
const customerTimelineSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    event: { type: String, enum: Object.values(CUSTOMER_TIMELINE_EVENTS), required: true },
    note: { type: String, trim: true, default: '' },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
);

export const CustomerTimeline = mongoose.model('CustomerTimeline', customerTimelineSchema);
