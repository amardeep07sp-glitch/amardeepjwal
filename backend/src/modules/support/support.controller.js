import { asyncHandler } from '../../utils/asyncHandler.js';
import { ApiResponse } from '../../utils/ApiResponse.js';
import { ApiError } from '../../utils/ApiError.js';
import { supportService } from './support.service.js';
import { slaService } from './sla.service.js';
import { assignmentService } from './assignment.service.js';
import { serializeTicket, serializeTicketList, serializeTicketMessageList, serializeTicketMessage } from './supportTicket.serializer.js';
import { TICKET_SOURCES } from './support.constants.js';
import { ROLES } from '../../constants/roles.js';

const serializeSlaPolicy = (policy) => ({
  tiers: policy.tiers.map((t) => ({ priority: t.priority, firstResponseMins: t.firstResponseMins, resolutionMins: t.resolutionMins })),
  updatedAt: policy.updatedAt,
});

// A plain SUPPORT_AGENT only ever works their own assigned tickets -
// everyone else (STAFF/PRIVILEGED/SUPPORT_MANAGER) keeps the original
// all-or-nothing visibility this module already had. Scoping lives here
// (controller layer, req.user-aware) rather than in support.service.js,
// which stays a plain data layer with no auth concept of its own.
const isScopedAgent = (user) => user.role === ROLES.SUPPORT_AGENT;

function assertAgentOwnsTicket(ticket, user) {
  if (!isScopedAgent(user)) return;
  const assignedId = ticket.assignedAgentId?._id ?? ticket.assignedAgentId;
  if (String(assignedId ?? '') !== String(user._id)) {
    throw new ApiError(403, 'This ticket is not assigned to you');
  }
}

export const listTickets = asyncHandler(async (req, res) => {
  const query = isScopedAgent(req.user) ? { ...req.query, assignedAgentId: req.user._id } : req.query;
  const { items, meta } = await supportService.listTickets(query);
  res.status(200).json(new ApiResponse(200, { items: serializeTicketList(items), meta }, 'Tickets fetched successfully'));
});

export const getDashboardCounts = asyncHandler(async (req, res) => {
  const counts = await supportService.getDashboardCounts();
  res.status(200).json(new ApiResponse(200, counts, 'Support dashboard counts fetched successfully'));
});

export const getTicketById = asyncHandler(async (req, res) => {
  const ticket = await supportService.getTicketById(req.params.id);
  assertAgentOwnsTicket(ticket, req.user);
  const messages = await supportService.listMessages(ticket._id, { includeInternal: true });
  res.status(200).json(new ApiResponse(200, { ticket: serializeTicket(ticket), messages: serializeTicketMessageList(messages) }, 'Ticket fetched successfully'));
});

export const createTicketAdmin = asyncHandler(async (req, res) => {
  if (!req.body.customerId) throw new ApiError(400, 'customerId is required');
  const { ticket } = await supportService.createTicket(
    { customerId: req.body.customerId, subject: req.body.subject, category: req.body.category, priority: req.body.priority, source: TICKET_SOURCES.WEB, message: req.body.message },
    req.user._id
  );
  res.status(201).json(new ApiResponse(201, serializeTicket(ticket), 'Ticket created successfully'));
});

export const assignTicket = asyncHandler(async (req, res) => {
  const existing = await supportService.getTicketById(req.params.id);
  assertAgentOwnsTicket(existing, req.user);
  const ticket = await supportService.assignTicket(req.params.id, req.body.agentUserId, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeTicket(ticket), 'Ticket assigned successfully'));
});

export const updatePriority = asyncHandler(async (req, res) => {
  const existing = await supportService.getTicketById(req.params.id);
  assertAgentOwnsTicket(existing, req.user);
  const ticket = await supportService.updatePriority(req.params.id, req.body.priority, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeTicket(ticket), 'Ticket priority updated successfully'));
});

export const updateStatus = asyncHandler(async (req, res) => {
  const existing = await supportService.getTicketById(req.params.id);
  assertAgentOwnsTicket(existing, req.user);
  const ticket = await supportService.updateStatus(req.params.id, req.body.status, req.user._id, { note: req.body.note });
  res.status(200).json(new ApiResponse(200, serializeTicket(ticket), 'Ticket status updated successfully'));
});

export const addAgentMessage = asyncHandler(async (req, res) => {
  const existing = await supportService.getTicketById(req.params.id);
  assertAgentOwnsTicket(existing, req.user);
  const message = await supportService.addAgentMessage(req.params.id, { content: req.body.content, type: req.body.type, attachmentFiles: req.files }, req.user._id);
  res.status(201).json(new ApiResponse(201, serializeTicketMessage(message), 'Message added successfully'));
});

export const getSlaPolicy = asyncHandler(async (req, res) => {
  const policy = await slaService.getPolicy();
  res.status(200).json(new ApiResponse(200, serializeSlaPolicy(policy), 'SLA policy fetched successfully'));
});

export const updateSlaPolicy = asyncHandler(async (req, res) => {
  const policy = await slaService.updatePolicy(req.body.tiers, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeSlaPolicy(policy), 'SLA policy updated successfully'));
});

const serializeAssignmentRule = (rule) => ({
  id: rule._id,
  category: rule.category,
  agent:
    rule.agentUserId && typeof rule.agentUserId === 'object'
      ? { id: rule.agentUserId._id.toString(), name: rule.agentUserId.name, email: rule.agentUserId.email }
      : { id: rule.agentUserId?.toString?.() ?? rule.agentUserId },
  active: rule.active,
  updatedAt: rule.updatedAt,
});

export const listAssignmentRules = asyncHandler(async (req, res) => {
  const rules = await assignmentService.listRules();
  res.status(200).json(new ApiResponse(200, rules.map(serializeAssignmentRule), 'Assignment rules fetched successfully'));
});

export const setAssignmentRule = asyncHandler(async (req, res) => {
  const rule = await assignmentService.setRule(req.body.category, req.body.agentUserId, req.user._id);
  res.status(200).json(new ApiResponse(200, serializeAssignmentRule(rule), 'Assignment rule saved successfully'));
});

export const removeAssignmentRule = asyncHandler(async (req, res) => {
  await assignmentService.removeRule(req.params.category, req.user._id);
  res.status(200).json(new ApiResponse(200, null, 'Assignment rule removed successfully'));
});
