import { Customer } from './customer.model.js';

const POPULATE_FIELDS = [
  { path: 'avatarMedia' },
  { path: 'preferredStore', select: 'name code' },
  { path: 'tags', select: 'name color' },
  { path: 'segments', select: 'name color' },
  { path: 'referredBy', select: 'firstName lastName displayName customerCode' },
];

export const customerRepository = {
  async findPaginated({ page, limit, status, customerType, segment, tag, dateFrom, dateTo, search, sortBy, sortOrder }) {
    const filter = {};
    if (status) filter.status = status;
    if (customerType) filter.customerType = customerType;
    if (segment) filter.segments = segment;
    if (tag) filter.tags = tag;
    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) filter.createdAt.$gte = new Date(dateFrom);
      if (dateTo) filter.createdAt.$lte = new Date(dateTo);
    }
    if (search) {
      filter.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { displayName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
        { customerCode: { $regex: search, $options: 'i' } },
        { gstNumber: { $regex: search, $options: 'i' } },
      ];
    }

    const sort = { [sortBy]: sortOrder === 'asc' ? 1 : -1 };
    const skip = (page - 1) * limit;

    const [items, total] = await Promise.all([
      Customer.find(filter).populate(POPULATE_FIELDS).sort(sort).skip(skip).limit(limit),
      Customer.countDocuments(filter),
    ]);

    return { items, total };
  },

  findById(id) {
    return Customer.findById(id).populate(POPULATE_FIELDS);
  },

  findRawById(id, session) {
    return Customer.findById(id).session(session ?? null);
  },

  // Batch lookup for reports that already have a list of customer ids (e.g.
  // Accounting's Receivables/Aging reports) and just need display fields.
  findManyByIds(ids) {
    return Customer.find({ _id: { $in: ids } }).select('displayName customerCode phone email');
  },

  // The storefront's own resolution path (storefront.service.js) - every
  // customer-scoped route starts from `req.user` (the auth User) and needs
  // the Customer/CRM record it's linked to.
  findByUser(userId) {
    return Customer.findOne({ user: userId });
  },

  findByEmail(email) {
    return Customer.findOne({ email });
  },

  findByPhone(phone) {
    return Customer.findOne({ phone });
  },

  findByReferralCode(referralCode) {
    return Customer.findOne({ referralCode });
  },

  async create(data, session) {
    const [created] = await Customer.create([data], { session: session ?? undefined });
    return created;
  },

  async updateById(id, data, session) {
    const existing = await Customer.findById(id).session(session ?? null);
    if (!existing) return null;
    Object.assign(existing, data);
    return existing.save({ session: session ?? undefined });
  },

  deleteById(id) {
    return Customer.findByIdAndDelete(id);
  },

  updateManyStatus(ids, status) {
    return Customer.updateMany({ _id: { $in: ids } }, { $set: { status } });
  },

  addTag(id, tagId) {
    return Customer.findByIdAndUpdate(id, { $addToSet: { tags: tagId } }, { new: true });
  },

  removeTag(id, tagId) {
    return Customer.findByIdAndUpdate(id, { $pull: { tags: tagId } }, { new: true });
  },

  addSegment(id, segmentId) {
    return Customer.findByIdAndUpdate(id, { $addToSet: { segments: segmentId } }, { new: true });
  },

  removeSegment(id, segmentId) {
    return Customer.findByIdAndUpdate(id, { $pull: { segments: segmentId } }, { new: true });
  },

  countTotal() {
    return Customer.countDocuments({});
  },

  async getDashboardTotals(sinceDate) {
    const [totalCustomers, newCustomers, vipCustomers, statusCounts] = await Promise.all([
      Customer.countDocuments({}),
      Customer.countDocuments({ createdAt: { $gte: sinceDate } }),
      Customer.countDocuments({ status: 'vip' }),
      Customer.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]),
    ]);

    return { totalCustomers, newCustomers, vipCustomers, countsByStatus: Object.fromEntries(statusCounts.map((r) => [r._id, r.count])) };
  },

  getGrowthTrend(sinceDate) {
    return Customer.aggregate([
      { $match: { createdAt: { $gte: sinceDate } } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);
  },

  findAllForExport(filter = {}) {
    return Customer.find(filter).populate(POPULATE_FIELDS).sort({ createdAt: -1 });
  },

  // Broadcast's own bulk-read - a lean cursor rather than loading every
  // customer into memory at once, since "all customers" can be an
  // unbounded number (see broadcast.service.js#processBroadcast, which is
  // the only caller of this).
  streamAllContacts() {
    return Customer.find({}).select('_id email phone').lean().cursor();
  },
};
