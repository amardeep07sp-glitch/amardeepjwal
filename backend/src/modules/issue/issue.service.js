import { ApiError } from '../../utils/ApiError.js';
import { issueReportRepository } from './issueReport.repository.js';
import { supportNumbering } from '../shared/support.numbering.js';
import { activityLogService } from '../activityLog/activityLog.service.js';
import { uploadAttachments } from '../shared/attachmentUpload.util.js';
import { issueReportNotifications } from './issueReport.notifications.js';
import { MEDIA_ENTITY_TYPES } from '../media/media.constants.js';
import { ISSUE_STATUSES, ISSUE_SUBCATEGORIES_BY_CATEGORY, ISSUE_DUPLICATE_WINDOW_HOURS } from './issue.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

export const issueService = {
  // `metadata` is the Context Engine's auto-captured snapshot (Phase 53) -
  // whatever the reporting page already knew (order number, product name,
  // coupon code, cart subtotal, gateway error code) so the reporter only
  // ever supplies the reason + description + evidence.
  // Returns { issue, isDuplicate } - Phase 32: a still-open report on the
  // same entity from the same reporter within ISSUE_DUPLICATE_WINDOW_HOURS
  // returns the EXISTING issue instead of creating a new one, so a
  // customer double-clicking (or re-reporting the same broken thing) never
  // silently multiplies the queue.
  async createIssue({ reporterId, category, subCategory, entityType, entityId, description, metadata, source, attachmentFiles }, actorUserId) {
    if (subCategory) {
      const allowed = ISSUE_SUBCATEGORIES_BY_CATEGORY[category] ?? [];
      if (!allowed.includes(subCategory)) throw new ApiError(400, `"${subCategory}" is not a valid reason for category "${category}"`);
    }

    const sinceDate = new Date(Date.now() - ISSUE_DUPLICATE_WINDOW_HOURS * 3600000);
    const duplicate = await issueReportRepository.findRecentDuplicate({ reporterId, category, entityType, entityId, sinceDate });
    if (duplicate) {
      return { issue: await issueReportRepository.findById(duplicate._id), isDuplicate: true };
    }

    const issueNumber = await supportNumbering.getNextIssueNumber();
    const issue = await issueReportRepository.create({
      issueNumber,
      reporterId,
      category,
      subCategory: subCategory ?? '',
      entityType: entityType ?? '',
      entityId: entityId ?? '',
      description,
      metadata: metadata ?? {},
      source,
      status: ISSUE_STATUSES.OPEN,
      createdBy: actorUserId,
      updatedBy: actorUserId,
    });

    if (attachmentFiles?.length) {
      const attachments = await uploadAttachments(attachmentFiles, MEDIA_ENTITY_TYPES.ISSUE_REPORT, issue._id, actorUserId);
      issue.attachments = attachments;
      await issue.save();
    }

    await activityLogService.record({ module: 'issue', action: 'issue.created', entityId: issue._id, entityName: issueNumber, performedBy: actorUserId, metadata: { category, subCategory } });
    return { issue, isDuplicate: false };
  },

  async listIssues(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await issueReportRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getIssueById(id) {
    const issue = await issueReportRepository.findById(id);
    if (!issue) throw new ApiError(404, 'Issue report not found');
    return issue;
  },

  async assignIssue(id, assigneeUserId, actorUserId) {
    const issue = await issueReportRepository.updateById(id, { assignedTo: assigneeUserId, updatedBy: actorUserId, status: ISSUE_STATUSES.UNDER_REVIEW });
    if (!issue) throw new ApiError(404, 'Issue report not found');
    await activityLogService.record({ module: 'issue', action: 'issue.assigned', entityId: issue._id, entityName: issue.issueNumber, performedBy: actorUserId, metadata: { assigneeUserId } });
    if (issue.reporterId) await issueReportNotifications.notifyStatusChanged(issue.reporterId, issue, ISSUE_STATUSES.UNDER_REVIEW);
    return issue;
  },

  async updateStatus(id, status, actorUserId, { resolutionNote } = {}) {
    const existing = await issueReportRepository.findRawById(id);
    if (!existing) throw new ApiError(404, 'Issue report not found');

    const patch = { status, updatedBy: actorUserId };
    if (resolutionNote != null) patch.resolutionNote = resolutionNote;
    if ([ISSUE_STATUSES.RESOLVED, ISSUE_STATUSES.REJECTED, ISSUE_STATUSES.CLOSED].includes(status)) patch.resolvedAt = new Date();

    const issue = await issueReportRepository.updateById(id, patch);
    await activityLogService.record({ module: 'issue', action: 'issue.status_changed', entityId: issue._id, entityName: issue.issueNumber, performedBy: actorUserId, metadata: { oldStatus: existing.status, newStatus: status } });
    if (issue.reporterId) await issueReportNotifications.notifyStatusChanged(issue.reporterId, issue, status);
    return issue;
  },

  // ---- Customer-scoped ----
  async listMyIssues(reporterId, query) {
    const { page, limit, status } = query;
    const { items, total } = await issueReportRepository.findPaginated({ page, limit, status, reporterId });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getMyIssue(reporterId, issueId) {
    const issue = await issueReportRepository.findById(issueId);
    if (!issue || String(issue.reporterId.id ?? issue.reporterId._id) !== String(reporterId)) {
      throw new ApiError(404, 'Issue report not found');
    }
    return issue;
  },
};
