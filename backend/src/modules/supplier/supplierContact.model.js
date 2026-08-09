import mongoose from 'mongoose';

// Additional named contacts at a supplier (a distributor/manufacturer may
// have several people staff deal with - sales rep, accounts, dispatch) -
// distinct from the Supplier record itself, which represents the vendor
// account being purchased from.
const supplierContactSchema = new mongoose.Schema(
  {
    supplier: { type: mongoose.Schema.Types.ObjectId, ref: 'Supplier', required: true, index: true },
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const SupplierContact = mongoose.model('SupplierContact', supplierContactSchema);
