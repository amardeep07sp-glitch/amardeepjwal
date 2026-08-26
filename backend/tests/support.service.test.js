import { jest } from '@jest/globals';

const mockTicketRepo = {
  findPaginated: jest.fn(),
  findById: jest.fn(),
  findRawById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  getDashboardCounts: jest.fn(),
  findRecentDuplicate: jest.fn(),
};
const mockMessageRepo = {
  create: jest.fn(),
  findByTicket: jest.fn(),
  countByTicket: jest.fn(),
  markReadByCustomer: jest.fn(),
};
const mockNumbering = { getNextTicketNumber: jest.fn(), getNextIssueNumber: jest.fn() };
const mockTicketNotifications = { notifyCreated: jest.fn(), notifyAgentReplied: jest.fn(), notifyStatusChanged: jest.fn() };
const mockCustomerRepo = { findRawById: jest.fn() };
const mockActivityLog = { record: jest.fn() };
const mockUploadAttachments = jest.fn();
const mockSlaService = { computeDeadlines: jest.fn() };
const mockAssignmentService = { resolveAgentForCategory: jest.fn() };

jest.unstable_mockModule('../src/modules/support/supportTicket.repository.js', () => ({ supportTicketRepository: mockTicketRepo }));
jest.unstable_mockModule('../src/modules/support/ticketMessage.repository.js', () => ({ ticketMessageRepository: mockMessageRepo }));
jest.unstable_mockModule('../src/modules/shared/support.numbering.js', () => ({ supportNumbering: mockNumbering }));
jest.unstable_mockModule('../src/modules/support/supportTicket.notifications.js', () => ({ supportTicketNotifications: mockTicketNotifications }));
jest.unstable_mockModule('../src/modules/customer/customer.repository.js', () => ({ customerRepository: mockCustomerRepo }));
jest.unstable_mockModule('../src/modules/activityLog/activityLog.service.js', () => ({ activityLogService: mockActivityLog }));
jest.unstable_mockModule('../src/modules/shared/attachmentUpload.util.js', () => ({ uploadAttachments: mockUploadAttachments }));
// Mocked because sla.service.js transitively loads slaPolicy.model.js
// (real `new mongoose.Schema(...)` + a live findOne() against SlaPolicy),
// which has no DB connection to hit under this unit-test setup.
jest.unstable_mockModule('../src/modules/support/sla.service.js', () => ({ slaService: mockSlaService }));
jest.unstable_mockModule('../src/modules/support/assignment.service.js', () => ({ assignmentService: mockAssignmentService }));

const { supportService } = await import('../src/modules/support/support.service.js');
const { TICKET_STATUSES, TICKET_PRIORITIES, MESSAGE_TYPES, SENDER_ROLES } = await import('../src/modules/support/support.constants.js');
const { ApiError } = await import('../src/utils/ApiError.js');

beforeEach(() => {
  [
    mockTicketRepo,
    mockMessageRepo,
    mockNumbering,
    mockTicketNotifications,
    mockCustomerRepo,
    mockActivityLog,
    mockSlaService,
    mockAssignmentService,
    { uploadAttachments: mockUploadAttachments },
  ].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset()));
  mockUploadAttachments.mockResolvedValue([]);
  mockCustomerRepo.findRawById.mockResolvedValue({ _id: 'cust1', email: 'a@b.com', phone: '9999999999' });
  mockSlaService.computeDeadlines.mockResolvedValue({ firstResponseDueAt: null, resolutionDueAt: null });
  mockAssignmentService.resolveAgentForCategory.mockResolvedValue(null);
  mockTicketRepo.findRecentDuplicate.mockResolvedValue(null);
});

const rawTicket = (overrides = {}) => ({
  _id: 'ticket1',
  ticketNumber: 'TKT-0000001',
  customer: 'cust1',
  subject: 'Where is my order',
  status: TICKET_STATUSES.OPEN,
  priority: TICKET_PRIORITIES.MEDIUM,
  save: jest.fn(function save() {
    return Promise.resolve(this);
  }),
  ...overrides,
});

describe('support.service#createTicket', () => {
  it('generates a ticket number, creates the ticket, and writes the first message', async () => {
    mockNumbering.getNextTicketNumber.mockResolvedValue('TKT-0000001');
    mockTicketRepo.create.mockResolvedValue(rawTicket());

    const { ticket, isDuplicate } = await supportService.createTicket(
      { customerId: 'cust1', subject: 'Where is my order', category: 'order', priority: 'medium', source: 'web', context: { orderId: 'order1' }, message: 'Please help', attachmentFiles: [] },
      'user1'
    );

    expect(ticket.ticketNumber).toBe('TKT-0000001');
    expect(isDuplicate).toBe(false);
    expect(mockMessageRepo.create).toHaveBeenCalledWith(expect.objectContaining({ senderRole: SENDER_ROLES.CUSTOMER, type: MESSAGE_TYPES.MESSAGE, content: 'Please help' }));
    expect(mockActivityLog.record).toHaveBeenCalledWith(expect.objectContaining({ module: 'support', action: 'ticket.created' }));
    expect(mockTicketNotifications.notifyCreated).toHaveBeenCalled();
  });

  it('returns the existing ticket instead of creating a new one within the dedup window', async () => {
    const existing = rawTicket({ ticketNumber: 'TKT-0000000' });
    mockTicketRepo.findRecentDuplicate.mockResolvedValue(existing);
    mockTicketRepo.findById.mockResolvedValue(existing);

    const { ticket, isDuplicate } = await supportService.createTicket(
      { customerId: 'cust1', subject: 'Where is my order', category: 'order', context: { orderId: 'order1' } },
      'user1'
    );

    expect(isDuplicate).toBe(true);
    expect(ticket).toBe(existing);
    expect(mockTicketRepo.create).not.toHaveBeenCalled();
    expect(mockNumbering.getNextTicketNumber).not.toHaveBeenCalled();
  });

  it('skips the first message when none is provided', async () => {
    mockNumbering.getNextTicketNumber.mockResolvedValue('TKT-0000002');
    mockTicketRepo.create.mockResolvedValue(rawTicket({ ticketNumber: 'TKT-0000002' }));

    await supportService.createTicket({ customerId: 'cust1', subject: 'Question', category: 'other' }, 'user1');

    expect(mockMessageRepo.create).not.toHaveBeenCalled();
  });

  it('auto-assigns and starts IN_PROGRESS when an active routing rule matches the category', async () => {
    mockNumbering.getNextTicketNumber.mockResolvedValue('TKT-0000003');
    mockAssignmentService.resolveAgentForCategory.mockResolvedValue('agent42');
    mockTicketRepo.create.mockResolvedValue(rawTicket({ ticketNumber: 'TKT-0000003', assignedAgentId: 'agent42', status: TICKET_STATUSES.IN_PROGRESS }));

    await supportService.createTicket({ customerId: 'cust1', subject: 'Payment failed', category: 'payment' }, 'user1');

    expect(mockTicketRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ assignedAgentId: 'agent42', status: TICKET_STATUSES.IN_PROGRESS })
    );
    expect(mockActivityLog.record).toHaveBeenCalledWith(expect.objectContaining({ action: 'ticket.auto_assigned', metadata: { agentUserId: 'agent42' } }));
  });
});

describe('support.service#updateStatus', () => {
  it('allows a valid forward transition and stamps resolvedAt', async () => {
    const ticket = rawTicket({ status: TICKET_STATUSES.IN_PROGRESS });
    mockTicketRepo.findRawById.mockResolvedValue(ticket);
    mockTicketRepo.findById.mockResolvedValue({ ...ticket, status: TICKET_STATUSES.RESOLVED });

    await supportService.updateStatus('ticket1', TICKET_STATUSES.RESOLVED, 'agent1');

    expect(ticket.status).toBe(TICKET_STATUSES.RESOLVED);
    expect(ticket.resolvedAt).toBeInstanceOf(Date);
    expect(mockMessageRepo.create).toHaveBeenCalledWith(expect.objectContaining({ senderRole: SENDER_ROLES.SYSTEM, type: MESSAGE_TYPES.SYSTEM_EVENT }));
    expect(mockTicketNotifications.notifyStatusChanged).toHaveBeenCalled();
  });

  it('rejects an invalid transition (e.g. closed -> open)', async () => {
    mockTicketRepo.findRawById.mockResolvedValue(rawTicket({ status: TICKET_STATUSES.CLOSED }));

    await expect(supportService.updateStatus('ticket1', TICKET_STATUSES.OPEN, 'agent1')).rejects.toThrow('Cannot move a ticket');
    expect(mockMessageRepo.create).not.toHaveBeenCalled();
  });

  it('throws 404 for a missing ticket', async () => {
    mockTicketRepo.findRawById.mockResolvedValue(null);
    await expect(supportService.updateStatus('nope', TICKET_STATUSES.RESOLVED, 'agent1')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('support.service#addAgentMessage', () => {
  it('a real reply sets firstResponseAt, moves status to waiting_for_customer, and notifies the customer', async () => {
    const ticket = rawTicket({ status: TICKET_STATUSES.IN_PROGRESS, firstResponseAt: null });
    mockTicketRepo.findRawById.mockResolvedValue(ticket);
    mockMessageRepo.create.mockResolvedValue({ _id: 'msg1', type: MESSAGE_TYPES.MESSAGE });

    await supportService.addAgentMessage('ticket1', { content: 'We are looking into it', type: MESSAGE_TYPES.MESSAGE }, 'agent1');

    expect(ticket.firstResponseAt).toBeInstanceOf(Date);
    expect(ticket.status).toBe(TICKET_STATUSES.WAITING_FOR_CUSTOMER);
    expect(mockTicketNotifications.notifyAgentReplied).toHaveBeenCalled();
  });

  it('an internal note never changes ticket status or notifies the customer', async () => {
    const ticket = rawTicket({ status: TICKET_STATUSES.IN_PROGRESS });
    mockTicketRepo.findRawById.mockResolvedValue(ticket);
    mockMessageRepo.create.mockResolvedValue({ _id: 'msg2', type: MESSAGE_TYPES.INTERNAL_NOTE });

    await supportService.addAgentMessage('ticket1', { content: 'Escalate to finance', type: MESSAGE_TYPES.INTERNAL_NOTE }, 'agent1');

    expect(ticket.status).toBe(TICKET_STATUSES.IN_PROGRESS);
    expect(ticket.save).not.toHaveBeenCalled();
    expect(mockTicketNotifications.notifyAgentReplied).not.toHaveBeenCalled();
  });
});

describe('support.service#addMyMessage (customer reply)', () => {
  it('reopens a waiting_for_customer ticket back to in_progress', async () => {
    const ticket = rawTicket({ customer: 'cust1', status: TICKET_STATUSES.WAITING_FOR_CUSTOMER });
    mockTicketRepo.findRawById.mockResolvedValue(ticket);
    mockMessageRepo.create.mockResolvedValue({ _id: 'msg3', type: MESSAGE_TYPES.MESSAGE });

    await supportService.addMyMessage('cust1', 'ticket1', { content: 'Still waiting' }, 'user1');

    expect(ticket.status).toBe(TICKET_STATUSES.IN_PROGRESS);
  });

  it('rejects a reply on a closed ticket', async () => {
    mockTicketRepo.findRawById.mockResolvedValue(rawTicket({ customer: 'cust1', status: TICKET_STATUSES.CLOSED }));
    await expect(supportService.addMyMessage('cust1', 'ticket1', { content: 'Hello?' }, 'user1')).rejects.toThrow('closed');
  });

  it('rejects a reply from a customer who does not own the ticket', async () => {
    mockTicketRepo.findRawById.mockResolvedValue(rawTicket({ customer: 'someone-else' }));
    await expect(supportService.addMyMessage('cust1', 'ticket1', { content: 'Hi' }, 'user1')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('support.service#getMyTicket (ownership scoping)', () => {
  it('returns the ticket when it belongs to the customer', async () => {
    mockTicketRepo.findById.mockResolvedValue(rawTicket({ customer: { id: 'cust1' } }));
    const ticket = await supportService.getMyTicket('cust1', 'ticket1');
    expect(ticket.ticketNumber).toBe('TKT-0000001');
  });

  it('404s when the ticket belongs to a different customer', async () => {
    mockTicketRepo.findById.mockResolvedValue(rawTicket({ customer: { id: 'someone-else' } }));
    await expect(supportService.getMyTicket('cust1', 'ticket1')).rejects.toMatchObject({ statusCode: 404 });
  });
});
