import { Account } from './account.model.js';

const POPULATE_FIELDS = [{ path: 'parent', select: 'code name' }];

export const accountRepository = {
  async findPaginated({ page, limit, type, active, search, sortBy, sortOrder }) {
    const filter = {};
    if (type) filter.type = type;
    if (active !== undefined) filter.active = active;
    if (search) {
      filter.$or = [{ code: { $regex: search, $options: 'i' } }, { name: { $regex: search, $options: 'i' } }];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Account.find(filter).populate(POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      Account.countDocuments(filter),
    ]);

    return { items, total };
  },

  findAll(filter = {}) {
    return Account.find(filter).sort({ code: 1 });
  },

  findById(id) {
    return Account.findById(id).populate(POPULATE_FIELDS);
  },

  findRawById(id, session) {
    return Account.findById(id).session(session ?? null);
  },

  findByCode(code, session) {
    return Account.findOne({ code }).session(session ?? null);
  },

  findChildren(parentId) {
    return Account.find({ parent: parentId }).sort({ code: 1 });
  },

  async create(data, session) {
    const [created] = await Account.create([data], { session: session ?? undefined });
    return created;
  },

  async updateById(id, data) {
    const existing = await Account.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save();
  },

  deleteById(id) {
    return Account.findByIdAndDelete(id);
  },

  countChildren(parentId) {
    return Account.countDocuments({ parent: parentId });
  },

  // THE only method permitted to change currentBalance - called exclusively
  // by journal.service.js#postJournal inside its transaction.
  applyBalanceDelta(id, delta, session) {
    return Account.findByIdAndUpdate(id, { $inc: { currentBalance: delta } }, { new: true, session: session ?? undefined });
  },

  // Cash + Bank system accounts' combined balance - backs the Financial
  // Dashboard's "Cash" card.
  async sumBalancesByCodes(codes) {
    const rows = await Account.find({ code: { $in: codes } }).select('currentBalance');
    return rows.reduce((sum, a) => sum + a.currentBalance, 0);
  },
};
