import { Expense } from './expense.model.js';

const POPULATE_FIELDS = [
  { path: 'category', select: 'name' },
  { path: 'attachments' },
  { path: 'submittedBy', select: 'name' },
  { path: 'approvedBy', select: 'name' },
];

export const expenseRepository = {
  async findPaginated({ page, limit, status, category, dateFrom, dateTo }) {
    const filter = {};
    if (status) filter.status = status;
    if (category) filter.category = category;
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      Expense.find(filter).populate(POPULATE_FIELDS).sort({ date: -1 }).skip(skip).limit(limit),
      Expense.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id, session) {
    return Expense.findById(id).session(session ?? null).populate(POPULATE_FIELDS);
  },

  findRawById(id, session) {
    return Expense.findById(id).session(session ?? null);
  },

  create(data) {
    return Expense.create(data);
  },

  updateById(id, data, session) {
    return Expense.findByIdAndUpdate(id, data, { new: true, session: session ?? undefined });
  },

  // Financial Dashboard's "Expenses" card - approved expenses within range.
  async sumApprovedInRange(dateFrom, dateTo) {
    const filter = { status: 'approved' };
    if (dateFrom || dateTo) {
      filter.date = {};
      if (dateFrom) filter.date.$gte = new Date(dateFrom);
      if (dateTo) filter.date.$lte = new Date(dateTo);
    }
    const [row] = await Expense.aggregate([{ $match: filter }, { $group: { _id: null, total: { $sum: '$amount' } } }]);
    return row?.total ?? 0;
  },
};
