import mongoose from 'mongoose';
import { ISSUE_CATEGORY_VALUES, ISSUE_PRIORITY_VALUES, ISSUE_PRIORITIES, ISSUE_STATUS_VALUES, ISSUE_STATUSES, ISSUE_SOURCE_VALUES, ISSUE_SOURCES } from './issue.constants.js';

// A one-shot contextual report (Phase 2's "Issue Report" vs "Support
// Ticket" distinction) - lighter weight than a SupportTicket, no message
// thread. `entityId` is a plain String (not typed ObjectId refs per
// category) since the reported entity varies by category (product/order/
// coupon/cart - and a cart has no persistent id in this app at all), and
// having one flexible field beats six mutually-exclusive optional ref
// fields. `metadata` carries whatever the Context Engine auto-captured for
// this category (Phase 53 - the reporter never re-types what the platform
// already knows).
const issueReportSchema = new mongoose.Schema(
  {
    issueNumber: { type: String, required: true, unique: true, index: true },
    reporterId: { type: mongoose.Schema.Types.ObjectId, ref: 'Customer', required: true, index: true },
    category: { type: String, enum: ISSUE_CATEGORY_VALUES, required: true, index: true },
    subCategory: { type: String, trim: true, default: '' },
    entityType: { type: String, trim: true, default: '' },
    entityId: { type: String, trim: true, default: '' },
    description: { type: String, required: true, trim: true },
    attachments: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Media' }],
    priority: { type: String, enum: ISSUE_PRIORITY_VALUES, default: ISSUE_PRIORITIES.MEDIUM },
    status: { type: String, enum: ISSUE_STATUS_VALUES, default: ISSUE_STATUSES.OPEN, index: true },
    source: { type: String, enum: ISSUE_SOURCE_VALUES, default: ISSUE_SOURCES.WEB },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null, index: true },
    resolutionNote: { type: String, trim: true, default: '' },
    resolvedAt: { type: Date, default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

issueReportSchema.index({ category: 1, status: 1, createdAt: -1 });
issueReportSchema.index({ entityType: 1, entityId: 1 });

export const IssueReport = mongoose.model('IssueReport', issueReportSchema);
