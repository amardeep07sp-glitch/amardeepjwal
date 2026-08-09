import { Supplier } from './supplier.model.js';

export const supplierRepository = {
  async findPaginated({ page, limit, status, search, sortBy, sortOrder }) {
    const filter = {};
    if (status) filter.status = status;
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { contactPerson: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { supplierCode: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Supplier.find(filter).sort(sort).skip(skip).limit(limit),
      Supplier.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return Supplier.findById(id);
  },

  // Unpopulated - used internally by services (ledger/PO) that only need
  // raw fields inside a transaction.
  findRawById(id, session) {
    return Supplier.findById(id).session(session ?? null);
  },

  // Batch lookup for reports that already have a list of supplier ids (e.g.
  // Accounting's Payables/Aging reports) and just need display fields.
  findManyByIds(ids) {
    return Supplier.find({ _id: { $in: ids } }).select('name supplierCode phone email');
  },

  findByEmail(email) {
    return Supplier.findOne({ email });
  },

  findByPhone(phone) {
    return Supplier.findOne({ phone });
  },

  findByGstNumber(gstNumber) {
    return Supplier.findOne({ gstNumber });
  },

  async create(data, session) {
    const [created] = await Supplier.create([data], { session: session ?? undefined });
    return created;
  },

  async updateById(id, data, session) {
    const existing = await Supplier.findById(id).session(session ?? null);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save({ session: session ?? undefined });
  },

  deleteById(id) {
    return Supplier.findByIdAndDelete(id);
  },

  countTotal() {
    return Supplier.countDocuments({});
  },

  countActive() {
    return Supplier.countDocuments({ status: 'active' });
  },

  // THE only method permitted to change outstandingBalance - called
  // exclusively by supplierLedger.service.js#recordEntry inside its
  // transaction, mirroring inventoryRepository.applyMovementDelta /
  // walletRepository.applyBalanceDelta exactly.
  applyLedgerDelta(id, delta, session) {
    return Supplier.findByIdAndUpdate(id, { $inc: { outstandingBalance: delta } }, { new: true, session: session ?? undefined });
  },

  // Dashboard's "Outstanding Payments" card - only positive balances count
  // as money we actually owe; a supplier in credit (negative balance)
  // doesn't offset what's owed to a different supplier.
  async sumOutstandingBalances() {
    const [row] = await Supplier.aggregate([
      { $match: { outstandingBalance: { $gt: 0 } } },
      { $group: { _id: null, total: { $sum: '$outstandingBalance' } } },
    ]);
    return row?.total ?? 0;
  },
};
