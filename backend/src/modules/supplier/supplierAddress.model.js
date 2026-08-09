import mongoose from 'mongoose';
import { SUPPLIER_ADDRESS_TYPES } from './supplier.constants.js';

// A supplier's address book - kept as its own domain-specific collection
// rather than force-merged into the CRM's Address collection (same
// precedent as OrderTimeline/CustomerTimeline coexisting as separate
// ledgers rather than one generic table - see supplier.constants.js).
const supplierAddressSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    type: { type: String, enum: Object.values(SUPPLIER_ADDRESS_TYPES), default: SUPPLIER_ADDRESS_TYPES.SHIPPING },
    label: { type: String, trim: true, default: '' },
    line1: { type: String, required: true, trim: true },
    line2: { type: String, trim: true, default: '' },
    city: { type: String, required: true, trim: true },
    state: { type: String, required: true, trim: true },
    postalCode: { type: String, required: true, trim: true },
    country: { type: String, trim: true, default: 'India' },
    phone: { type: String, trim: true, default: '' },
    isDefault: { type: Boolean, default: false },
  },
  { timestamps: true }
);

supplierAddressSchema.index({ supplier: 1, createdAt: -1 });

export const SupplierAddress = mongoose.model('SupplierAddress', supplierAddressSchema);
