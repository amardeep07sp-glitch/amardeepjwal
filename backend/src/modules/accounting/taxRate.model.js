import mongoose from 'mongoose';

// Configuration only, for now - "Future configurable rules" per the Phase
// 10 spec. The actual tax AMOUNT on a Sale/Purchase is computed upstream
// (Order/PurchaseOrder's own pricing), unchanged by this phase; what
// Accounting owns is splitting that already-known amount into CGST/SGST/
// IGST components at posting time - see tax.service.js#splitTax.
const taxRateSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    // Combined rate this configuration represents (e.g. 3 for jewellery's
    // 3% GST) - informational/future-use; cgstRate+sgstRate should sum to
    // this for an intra-state rule, igstRate should equal it for inter-state.
    rate: { type: Number, required: true, min: 0 },
    cgstRate: { type: Number, default: 0, min: 0 },
    sgstRate: { type: Number, default: 0, min: 0 },
    igstRate: { type: Number, default: 0, min: 0 },
    isDefault: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
);

export const TaxRate = mongoose.model('TaxRate', taxRateSchema);
