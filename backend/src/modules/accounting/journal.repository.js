import { Journal } from './journal.model.js';
import { JournalLine } from './journalLine.model.js';

const POPULATE_FIELDS = [{ path: 'postedBy', select: 'name' }];

export const journalRepository = {
  async findPaginated({ page, limit, eventType, referenceType, referenceId, status, dateFrom, dateTo, search }) {
    const filter = {};
    if (eventType) filter.eventType = eventType;
    if (referenceType) filter.referenceType = referenceType;
    if (referenceId) filter.referenceId = referenceId;
    if (status) filter.status = status;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    if (search) filter.$or = [{ journalNumber: { $regex: search, $options: 'i' } }, { narration: { $regex: search, $options: 'i' } }];

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Journal.find(filter).populate(POPULATE_FIELDS).sort({ date: -1, createdAt: -1 }).skip(skip).limit(limit),
      Journal.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id, session) {
    return Journal.findById(id).session(session ?? null).populate(POPULATE_FIELDS);
  },

  findByReference(referenceType, referenceId, session) {
    return Journal.findOne({ referenceType, referenceId, status: 'posted' }).session(session ?? null);
  },

  async create(data, session) {
    const [created] = await Journal.create([data], { session: session ?? undefined });
    return created;
  },

  updateById(id, data, session) {
    return Journal.findByIdAndUpdate(id, data, { new: true, session: session ?? undefined });
  },

  linesForJournal(journalId, session) {
    return JournalLine.find({ journal: journalId }).session(session ?? null).populate({ path: 'account', select: 'code name type' });
  },

  async createLines(lines, session) {
    return JournalLine.insertMany(lines, { session: session ?? undefined });
  },
};
