import { SupportTicket } from './supportTicket.model.js';
import { TICKET_NON_TERMINAL_STATUSES } from './support.constants.js';

const CUSTOMER_POPULATE = { path: 'customer', select: 'displayName phone email customerCode' };
const AGENT_POPULATE = { path: 'assignedAgentId', select: 'name email' };

const buildFilter = ({ status, priority, category, assignedAgentId, customerId, search }) => {
  const filter = {};
  if (status) filter.status = status;
  if (priority) filter.priority = priority;
  if (category) filter.category = category;
  if (assignedAgentId) filter.assignedAgentId = assignedAgentId;
  if (customerId) filter.customer = customerId;
  if (search) filter.$or = [{ ticketNumber: { $regex: search.trim(), $options: 'i' } }, { subject: { $regex: search.trim(), $options: 'i' } }];
  return filter;
};

export const supportTicketRepository = {
  async findPaginated({ page, limit, ...filters }) {
    const filter = buildFilter(filters);
    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      SupportTicket.find(filter).populate(CUSTOMER_POPULATE).populate(AGENT_POPULATE).sort({ createdAt: -1 }).skip(skip).limit(limit),
      SupportTicket.countDocuments(filter),
    ]);
    return { items, total };
  },

  findById(id) {
    return SupportTicket.findById(id).populate(CUSTOMER_POPULATE).populate(AGENT_POPULATE);
  },

  // Unpopulated, for internal service logic that only needs raw fields
  // (status transitions, ownership checks) - avoids paying for two
  // populate joins on every write path.
  findRawById(id) {
    return SupportTicket.findById(id);
  },

  create(data) {
    return SupportTicket.create(data);
  },

  // Phase 32 dedup check - only meaningful when the ticket actually
  // references an order (its real shared key); a category-only ticket
  // with no orderId always creates fresh, same as before.
  findRecentDuplicate({ customerId, category, orderId, sinceDate }) {
    if (!orderId) return null;
    return SupportTicket.findOne({
      customer: customerId,
      category,
      'context.orderId': orderId,
      status: { $in: TICKET_NON_TERMINAL_STATUSES },
      createdAt: { $gte: sinceDate },
    }).sort({ createdAt: -1 });
  },

  async updateById(id, data) {
    const existing = await SupportTicket.findById(id);
    if (!existing) return null;
    Object.assign(existing, data);
    await existing.save();
    return SupportTicket.findById(id).populate(CUSTOMER_POPULATE).populate(AGENT_POPULATE);
  },

  // Dashboard counters (Phase 29) - real counts, not cached/derived.
  async getDashboardCounts() {
    const [open, urgent, unassigned, waitingForCustomer, slaBreached] = await Promise.all([
      SupportTicket.countDocuments({ status: { $in: ['open', 'in_progress'] } }),
      SupportTicket.countDocuments({ priority: 'urgent', status: { $nin: ['resolved', 'closed'] } }),
      SupportTicket.countDocuments({ assignedAgentId: null, status: { $nin: ['resolved', 'closed'] } }),
      SupportTicket.countDocuments({ status: 'waiting_for_customer' }),
      SupportTicket.countDocuments({ slaBreached: true, status: { $nin: ['resolved', 'closed'] } }),
    ]);
    const startOfToday = new Date();
    startOfToday.setHours(0, 0, 0, 0);
    const [createdToday, resolvedToday] = await Promise.all([
      SupportTicket.countDocuments({ createdAt: { $gte: startOfToday } }),
      SupportTicket.countDocuments({ resolvedAt: { $gte: startOfToday } }),
    ]);
    return { open, urgent, unassigned, waitingForCustomer, slaBreached, createdToday, resolvedToday };
  },
};
