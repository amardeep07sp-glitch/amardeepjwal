import { CustomerLoyalty } from './customerLoyalty.model.js';
import { LoyaltyLedger } from './loyaltyLedger.model.js';

export const loyaltyRepository = {
  findByCustomer(customerId, session) {
    return CustomerLoyalty.findOne({ customer: customerId }).session(session ?? null);
  },

  async create(customerId, session) {
    const [created] = await CustomerLoyalty.create([{ customer: customerId }], { session: session ?? undefined });
    return created;
  },

  // THE only method permitted to change currentPoints/lifetimePointsEarned/
  // currentTier - called exclusively by loyalty.service.js#recordTransaction.
  updateBalance(customerId, { pointsDelta, lifetimeDelta, newTier }, session) {
    return CustomerLoyalty.findOneAndUpdate(
      { customer: customerId },
      { $inc: { currentPoints: pointsDelta, lifetimePointsEarned: lifetimeDelta }, $set: { currentTier: newTier } },
      { new: true, session: session ?? undefined }
    );
  },

  async findLedgerPaginated(customerId, { page, limit }) {
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      LoyaltyLedger.find({ customer: customerId }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      LoyaltyLedger.countDocuments({ customer: customerId }),
    ]);
    return { items, total };
  },

  async createLedgerEntry(data, session) {
    const [created] = await LoyaltyLedger.create([data], { session: session ?? undefined });
    return created;
  },

  // Backs the CRM Dashboard's aggregate "Reward Points" stat card.
  async sumAllCurrentPoints() {
    const [row] = await CustomerLoyalty.aggregate([{ $group: { _id: null, total: { $sum: '$currentPoints' } } }]);
    return row?.total ?? 0;
  },
};
