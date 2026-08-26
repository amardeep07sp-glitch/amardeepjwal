import { IssueReport } from './issueReport.model.js';
import { ISSUE_NON_TERMINAL_STATUSES } from './issue.constants.js';

const CUSTOMER_POPULATE = { path: 'reporterId', select: 'displayName phone email customerCode' };
const ASSIGNEE_POPULATE = { path: 'assignedTo', select: 'name email' };

const buildFilter = ({ status, category, priority, assignedTo, entityType, entityId, reporterId, search }) => {
  const filter = {};
  if (status) filter.status = status;
  if (category) filter.category = category;
  if (priority) filter.priority = priority;
  if (assignedTo) filter.assignedTo = assignedTo;
  if (entityType) filter.entityType = entityType;
  if (entityId) filter.entityId = entityId;
  if (reporterId) filter.reporterId = reporterId;
  if (search) filter.$or = [{ issueNumber: { $regex: search.trim(), $options: 'i' } }, { description: { $regex: search.trim(), $options: 'i' } }];
  return filter;
};

export const issueReportRepository = {
  async findPaginated({ page, limit, ...filters }) {
    const filter = buildFilter(filters);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      IssueReport.find(filter).populate(CUSTOMER_POPULATE).populate(ASSIGNEE_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
      IssueReport.countDocuments(filter),
    ]);
    return { items, total };
  },

  findById(id) {
    return IssueReport.findById(id).populate(CUSTOMER_POPULATE).populate(ASSIGNEE_POPULATE).populate('attachments');
  },

  findRawById(id) {
    return IssueReport.findById(id);
  },

  create(data) {
    return IssueReport.create(data);
  },

  // Phase 32 dedup check - same reporter, same entity, same category,
  // still open, reported recently. `entityId` may legitimately be '' (a
  // category-only report with no specific entity, e.g. a general account
  // issue) - matched as-is rather than treated as "no filter".
  findRecentDuplicate({ reporterId, category, entityType, entityId, sinceDate }) {
    return IssueReport.findOne({
      reporterId,
      category,
      entityType: entityType ?? '',
      entityId: entityId ?? '',
      status: { $in: ISSUE_NON_TERMINAL_STATUSES },
      createdAt: { $gte: sinceDate },
    }).sort({ createdAt: -1 });
  },

  async updateById(id, data) {
    const existing = await IssueReport.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    await existing.save();
    return IssueReport.findById(id).populate(CUSTOMER_POPULATE).populate(ASSIGNEE_POPULATE);
  },
};
