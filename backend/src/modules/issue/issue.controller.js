import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { issueService } from './issue.service.js';
import { serializeIssue, serializeIssueList } from './issueReport.serializer.js';

export const listIssues = asyncHandler(async (req, res) => {
  const { items, meta } = await issueService.listIssues(req.query);
  res.status(200).json(new ApiResponse(200, { items: serializeIssueList(items), meta }, 'Issue reports fetched successfully'));
});

export const getIssueById = asyncHandler(async (req, res) => {
  const issue = await issueService.getIssueById(req.params.id);
  res.status(200).json(new ApiResponse(200, serializeIssue(issue), 'Issue report fetched successfully'));
});

export const assignIssue = asyncHandler(async (req, res) => {
  const issue = await issueService.assignIssue(req.params.id, req.body.assigneeUserId, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeIssue(issue), 'Issue report assigned successfully'));
});

export const updateIssueStatus = asyncHandler(async (req, res) => {
  const issue = await issueService.updateStatus(req.params.id, req.body.status, req.user._id, { resolutionNote: req.body.resolutionNote });
  res.status(200).json(new ApiResponse(200, serializeIssue(issue), 'Issue report status updated successfully'));
});
