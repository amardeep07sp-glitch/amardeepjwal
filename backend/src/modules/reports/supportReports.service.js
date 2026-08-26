import { SupportTicket } from '../support/supportTicket.model.js';
import { IssueReport } from '../issue/issueReport.model.js';
import { supportTicketRepository } from '../support/supportTicket.repository.js';
import { issueReportRepository } from '../issue/issueReport.repository.js';
import { feedbackRepository } from '../feedback/feedback.repository.js';
import { buildDateRangeMatch, buildPaginationMeta } from './reportFilters.util.js';

const round1 = (n) => Math.round(n * 10) / 10;

function dateMatch(dateFrom, dateTo) {
  return buildDateRangeMatch('createdAt', dateFrom, dateTo) ?? {};
}

// Real average resolution/first-response time computed directly from the
// SupportTicket rows themselves (resolvedAt/firstResponseAt vs createdAt) -
// never a separately-maintained counter that could drift from the real
// data (Phase 43's own metrics, minus SLA-breach tracking - no SLA engine
// exists this pass, see the session's scoping decision).
export const supportReportsService = {
  async getTicketSummary({ dateFrom, dateTo } = {}) {
    const match = dateMatch(dateFrom, dateTo);
    const [totals] = await SupportTicket.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalTickets: { $sum: 1 },
          openTickets: { $sum: { $cond: [{ $in: ['$status', ['open', 'in_progress', 'waiting_for_customer']] }, 1, 0] } },
          resolvedTickets: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          closedTickets: { $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] } },
          avgResolutionMs: { $avg: { $cond: ['$resolvedAt', { $subtract: ['$resolvedAt', '$createdAt'] }, null] } },
          avgFirstResponseMs: { $avg: { $cond: ['$firstResponseAt', { $subtract: ['$firstResponseAt', '$createdAt'] }, null] } },
        },
      },
    ]);

    return {
      totalTickets: totals?.totalTickets ?? 0,
      openTickets: totals?.openTickets ?? 0,
      resolvedTickets: totals?.resolvedTickets ?? 0,
      closedTickets: totals?.closedTickets ?? 0,
      avgResolutionHours: totals?.avgResolutionMs ? round1(totals.avgResolutionMs / 3600000) : null,
      avgFirstResponseHours: totals?.avgFirstResponseMs ? round1(totals.avgFirstResponseMs / 3600000) : null,
    };
  },

  async getTicketsByCategory({ dateFrom, dateTo } = {}) {
    const match = dateMatch(dateFrom, dateTo);
    return SupportTicket.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).then((rows) =>
      rows.map((r) => ({ category: r._id, count: r.count }))
    );
  },

  async getTicketsByStatus({ dateFrom, dateTo } = {}) {
    const match = dateMatch(dateFrom, dateTo);
    return SupportTicket.aggregate([{ $match: match }, { $group: { _id: '$status', count: { $sum: 1 } } }]).then((rows) =>
      rows.map((r) => ({ status: r._id, count: r.count }))
    );
  },

  async getTicketsByAgent({ dateFrom, dateTo } = {}) {
    const match = { ...dateMatch(dateFrom, dateTo), assignedAgentId: { $ne: null } };
    const rows = await SupportTicket.aggregate([
      { $match: match },
      { $group: { _id: '$assignedAgentId', ticketCount: { $sum: 1 }, resolvedCount: { $sum: { $cond: [{ $in: ['$status', ['resolved', 'closed']] }, 1, 0] } } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'agent' } },
      { $unwind: { path: '$agent', preserveNullAndEmptyArrays: true } },
      { $sort: { ticketCount: -1 } },
    ]);
    return rows.map((r) => ({ agentId: r._id, name: r.agent?.name ?? 'Unknown', ticketCount: r.ticketCount, resolvedCount: r.resolvedCount }));
  },

  async getIssueSummary({ dateFrom, dateTo } = {}) {
    const match = dateMatch(dateFrom, dateTo);
    const [totals] = await IssueReport.aggregate([
      { $match: match },
      {
        $group: {
          _id: null,
          totalIssues: { $sum: 1 },
          openIssues: { $sum: { $cond: [{ $in: ['$status', ['open', 'under_review', 'in_progress', 'waiting_for_customer']] }, 1, 0] } },
          resolvedIssues: { $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] } },
          rejectedIssues: { $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] } },
        },
      },
    ]);

    return {
      totalIssues: totals?.totalIssues ?? 0,
      openIssues: totals?.openIssues ?? 0,
      resolvedIssues: totals?.resolvedIssues ?? 0,
      rejectedIssues: totals?.rejectedIssues ?? 0,
    };
  },

  async getIssuesByCategory({ dateFrom, dateTo } = {}) {
    const match = dateMatch(dateFrom, dateTo);
    return IssueReport.aggregate([{ $match: match }, { $group: { _id: '$category', count: { $sum: 1 } } }, { $sort: { count: -1 } }]).then((rows) =>
      rows.map((r) => ({ category: r._id, count: r.count }))
    );
  },

  getFeedbackSummary() {
    return feedbackRepository.getSummary();
  },

  // The one exportable, potentially-many-rows report in this domain -
  // mirrors salesReports.service.js#getSalesByProduct's shape (real
  // findPaginated + a flattened row shape for the export columns), unlike
  // the small aggregate breakdowns above which - same as every other
  // report domain's own by-category/by-status/summary reports - are never
  // export-worthy on their own.
  async getTicketList({ dateFrom, dateTo, page, limit, search }) {
    const filter = { ...dateMatch(dateFrom, dateTo) };
    if (search) filter.$or = [{ ticketNumber: { $regex: search.trim(), $options: 'i' } }, { subject: { $regex: search.trim(), $options: 'i' } }];

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      SupportTicket.find(filter)
        .populate({ path: 'customer', select: 'displayName phone email' })
        .populate({ path: 'assignedAgentId', select: 'name' })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      SupportTicket.countDocuments(filter),
    ]);

    return {
      items: items.map((t) => ({
        ticketNumber: t.ticketNumber,
        subject: t.subject,
        category: t.category,
        priority: t.priority,
        status: t.status,
        customerName: t.customer?.displayName ?? '',
        agentName: t.assignedAgentId?.name ?? 'Unassigned',
        createdAt: t.createdAt,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  },

  async getIssueList({ dateFrom, dateTo, page, limit, search }) {
    const filter = { ...dateMatch(dateFrom, dateTo) };
    if (search) filter.$or = [{ issueNumber: { $regex: search.trim(), $options: 'i' } }, { description: { $regex: search.trim(), $options: 'i' } }];

    const skip = (page - 1) * limit;
    const [items, total] = await Promise.all([
      IssueReport.find(filter).populate({ path: 'reporterId', select: 'displayName phone email' }).sort({ createdAt: -1 }).skip(skip).limit(limit),
      IssueReport.countDocuments(filter),
    ]);

    return {
      items: items.map((i) => ({
        issueNumber: i.issueNumber,
        category: i.category,
        subCategory: i.subCategory ?? '',
        priority: i.priority,
        status: i.status,
        reporterName: i.reporterId?.displayName ?? '',
        createdAt: i.createdAt,
      })),
      meta: buildPaginationMeta(page, limit, total),
    };
  },
};
