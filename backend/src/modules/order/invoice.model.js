import mongoose from 'mongoose';

const taxSummarySchema = new mongoose.Schema(
  {
    taxableAmount: { type: Number, default: 0 },
    taxAmount: { type: Number, default: 0 },
    taxPercentage: { type: Number, default: 0 },
    // A real GST split of the SAME taxAmount above (never a second tax
    // calculation) - intra-state (buyer state === seller state) splits it
    // evenly into CGST+SGST; inter-state charges the full amount as IGST.
    // Computed once at invoice-creation time from the seller's registered
    // state (Settings) and the order's real shipping state, then frozen
    // here - same snapshot discipline as the order's own address/customer
    // snapshots (order.model.js), so a later change to Settings can never
    // alter an already-issued invoice.
    taxType: { type: String, enum: ['intra_state', 'inter_state', 'unknown'], default: 'unknown' },
    placeOfSupply: { type: String, trim: true, default: '' },
    cgstAmount: { type: Number, default: 0 },
    sgstAmount: { type: Number, default: 0 },
    igstAmount: { type: Number, default: 0 },
  },
  { _id: false }
);

// One invoice per order for v1 (unique) - regenerated on-demand as a PDF
// from the Order's own persisted data, never cached as a Media asset, so
// the Order stays the single source of truth (see invoice.service.js).
const invoiceSchema = new mongoose.Schema(
  {
    order: { type: mongoose.Schema.Types.ObjectId, ref: 'Order', required: true, unique: true },
    invoiceNumber: { type: String, required: true, unique: true },
    invoiceDate: { type: Date, default: Date.now },
    taxSummary: { type: taxSummarySchema, default: () => ({}) },
  },
  { timestamps: true }
);

export const Invoice = mongoose.model('Invoice', invoiceSchema);
