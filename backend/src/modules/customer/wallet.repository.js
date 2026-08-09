import { CustomerWallet } from './customerWallet.model.js';
import { WalletLedger } from './walletLedger.model.js';

export const walletRepository = {
  findByCustomer(customerId, session) {
    return CustomerWallet.findOne({ customer: customerId }).session(session ?? null);
  },

  async create(customerId, session) {
    const [created] = await CustomerWallet.create([{ customer: customerId, balance: 0 }], { session: session ?? undefined });
    return created;
  },

  // THE only method permitted to change the balance - called exclusively by
  // wallet.service.js#recordTransaction inside its transaction. `delta` can
  // be negative (a debit).
  applyBalanceDelta(customerId, delta, session) {
    return CustomerWallet.findOneAndUpdate(
      { customer: customerId },
      { $inc: { balance: delta } },
      { new: true, session: session ?? undefined }
    );
  },

  async findLedgerPaginated(customerId, { page, limit }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      WalletLedger.find({ customer: customerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      WalletLedger.countDocuments({ customer: customerId }),
    ]);
    return { items, total };
  },

  async createLedgerEntry(data, session) {
    const [created] = await WalletLedger.create([data], { session: session ?? undefined });
    return created;
  },

  // Backs the CRM Dashboard's aggregate "Wallet Balance" stat card.
  async sumAllBalances() {
    const [row] = await CustomerWallet.aggregate([{ $group: { _id: null, total: { $sum: '$balance' } } }]);
    return row?.total ?? 0;
  },
};
