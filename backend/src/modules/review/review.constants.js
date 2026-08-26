export const REVIEW_STATUSES = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
});

export const REVIEW_STATUS_VALUES = Object.values(REVIEW_STATUSES);

// Phase 18 - a customer flagging a review goes to Review Moderation, NOT
// the general support/issue-report pipeline (spec's own explicit rule) -
// this is why it's a dedicated ReviewReport model/queue rather than routed
// through issue.service.js like every other "Report X" button.
export const REVIEW_REPORT_REASONS = Object.freeze({
  SPAM: 'spam',
  FAKE_REVIEW: 'fake_review',
  OFFENSIVE: 'offensive',
  IRRELEVANT: 'irrelevant',
  MISLEADING: 'misleading',
  PERSONAL_INFORMATION: 'personal_information',
  OTHER: 'other',
});

export const REVIEW_REPORT_REASON_VALUES = Object.values(REVIEW_REPORT_REASONS);

export const REVIEW_REPORT_STATUSES = Object.freeze({
  PENDING: 'pending',
  DISMISSED: 'dismissed',
  ACTIONED: 'actioned',
});

export const REVIEW_REPORT_STATUS_VALUES = Object.values(REVIEW_REPORT_STATUSES);
