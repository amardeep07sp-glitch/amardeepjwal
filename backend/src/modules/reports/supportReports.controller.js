import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { supportReportsService } from './supportReports.service.js';
import { sendReportExport } from './export.util.js';

export const getTicketSummary = asyncHandler(async (req, res) => {
  const summary = await supportReportsService.getTicketSummary(req.query);
  res.status(200).json(new ApiResponse(200, summary, 'Ticket summary fetched successfully'));
});

export const getTicketsByCategory = asyncHandler(async (req, res) => {
  const rows = await supportReportsService.getTicketsByCategory(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Tickets by category fetched successfully'));
});

export const getTicketsByStatus = asyncHandler(async (req, res) => {
  const rows = await supportReportsService.getTicketsByStatus(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Tickets by status fetched successfully'));
});

export const getTicketsByAgent = asyncHandler(async (req, res) => {
  const rows = await supportReportsService.getTicketsByAgent(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Tickets by agent fetched successfully'));
});

export const getIssueSummary = asyncHandler(async (req, res) => {
  const summary = await supportReportsService.getIssueSummary(req.query);
  res.status(200).json(new ApiResponse(200, summary, 'Issue report summary fetched successfully'));
});

export const getIssuesByCategory = asyncHandler(async (req, res) => {
  const rows = await supportReportsService.getIssuesByCategory(req.query);
  res.status(200).json(new ApiResponse(200, rows, 'Issue reports by category fetched successfully'));
});

export const getFeedbackSummary = asyncHandler(async (req, res) => {
  const summary = await supportReportsService.getFeedbackSummary();
  res.status(200).json(new ApiResponse(200, summary, 'Feedback summary fetched successfully'));
});

const TICKET_LIST_COLUMNS = [
  { key: 'ticketNumber', header: 'Ticket #' },
  { key: 'subject', header: 'Subject' },
  { key: 'category', header: 'Category' },
  { key: 'priority', header: 'Priority' },
  { key: 'status', header: 'Status' },
  { key: 'customerName', header: 'Customer' },
  { key: 'agentName', header: 'Agent' },
  { key: 'createdAt', header: 'Created' },
];

export const getTicketList = asyncHandler(async (req, res) => {
  const { format, ...query } = req.query;
  const result = await supportReportsService.getTicketList(query);
  if (format) return sendReportExport(res, format, { columns: TICKET_LIST_COLUMNS, rows: result.items, filename: 'support-tickets', title: 'Support Tickets' });
  res.status(200).json(new ApiResponse(200, result, 'Tickets fetched successfully'));
});

const ISSUE_LIST_COLUMNS = [
  { key: 'issueNumber', header: 'Issue #' },
  { key: 'category', header: 'Category' },
  { key: 'subCategory', header: 'Reason' },
  { key: 'priority', header: 'Priority' },
  { key: 'status', header: 'Status' },
  { key: 'reporterName', header: 'Reporter' },
  { key: 'createdAt', header: 'Created' },
];

export const getIssueList = asyncHandler(async (req, res) => {
  const { format, ...query } = req.query;
  const result = await supportReportsService.getIssueList(query);
  if (format) return sendReportExport(res, format, { columns: ISSUE_LIST_COLUMNS, rows: result.items, filename: 'issue-reports', title: 'Issue Reports' });
  res.status(200).json(new ApiResponse(200, result, 'Issue reports fetched successfully'));
});
