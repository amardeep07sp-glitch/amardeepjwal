import mongoose from 'mongoose';

// One per customer - balance is NEVER written directly (see wallet.service.js
// #recordTransaction, the single choke-point, same invariant shape as
// Inventory's Ledger). Auto-provisioned at zero balance when a Customer is
// created (customer.service.js#createCustomer).
const customerWalletSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, unique: true, index: true },
    balance: { type: Number, default: 0, min: 0 },
  },
  { timestamps: true }
);

export const CustomerWallet = mongoose.model('CustomerWallet', customerWalletSchema);
