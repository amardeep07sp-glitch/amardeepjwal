import mongoose from 'mongoose';

// Additional named contacts for a B2B/wholesale account (a company customer
// may have several people admins deal with) - distinct from the Customer
// record itself, which represents the account/individual being sold to.
const customerContactSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    name: { type: String, required: true, trim: true },
    designation: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    isPrimary: { type: Boolean, default: false },
  },
  { timestamps: true }
);

export const CustomerContact = mongoose.model('CustomerContact', customerContactSchema);
