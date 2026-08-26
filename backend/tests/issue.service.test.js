import { jest } from '@jest/globals';

const mockIssueRepo = {
  findPaginated: jest.fn(),
  findById: jest.fn(),
  findRawById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  findRecentDuplicate: jest.fn(),
};
const mockNumbering = { getNextTicketNumber: jest.fn(), getNextIssueNumber: jest.fn() };
const mockActivityLog = { record: jest.fn() };
const mockUploadAttachments = jest.fn();
const mockIssueNotifications = { notifyStatusChanged: jest.fn() };

jest.unstable_mockModule('../src/modules/issue/issueReport.repository.js', () => ({ issueReportRepository: mockIssueRepo }));
jest.unstable_mockModule('../src/modules/shared/support.numbering.js', () => ({ supportNumbering: mockNumbering }));
jest.unstable_mockModule('../src/modules/activityLog/activityLog.service.js', () => ({ activityLogService: mockActivityLog }));
jest.unstable_mockModule('../src/modules/shared/attachmentUpload.util.js', () => ({ uploadAttachments: mockUploadAttachments }));
// Mocked to avoid a real send attempt (customer.notifications.js ->
// notificationSender -> live Resend/WhatsApp calls) from tests that only
// care about the status-transition logic itself.
jest.unstable_mockModule('../src/modules/issue/issueReport.notifications.js', () => ({ issueReportNotifications: mockIssueNotifications }));

const { issueService } = await import('../src/modules/issue/issue.service.js');
const { ISSUE_STATUSES } = await import('../src/modules/issue/issue.constants.js');

beforeEach(() => {
  [mockIssueRepo, mockNumbering, mockActivityLog, mockIssueNotifications, { uploadAttachments: mockUploadAttachments }].forEach((mockObj) =>
    Object.values(mockObj).forEach((fn) => fn.mockReset())
  );
  mockUploadAttachments.mockResolvedValue(['media1']);
  mockIssueRepo.findRecentDuplicate.mockResolvedValue(null);
});

const rawIssue = (overrides = {}) => ({
  _id: 'issue1',
  issueNumber: 'ISS-0000001',
  status: ISSUE_STATUSES.OPEN,
  attachments: [],
  save: jest.fn(function save() {
    return Promise.resolve(this);
  }),
  ...overrides,
});

describe('issue.service#createIssue', () => {
  it('rejects a subCategory that does not belong to the given category', async () => {
    await expect(
      issueService.createIssue({ reporterId: 'cust1', category: 'product', subCategory: 'refund_delayed', description: 'wrong price shown' }, 'user1')
    ).rejects.toThrow('is not a valid reason for category');
    expect(mockIssueRepo.create).not.toHaveBeenCalled();
  });

  it('accepts a valid subCategory for its category and generates a real issue number', async () => {
    mockNumbering.getNextIssueNumber.mockResolvedValue('ISS-0000001');
    mockIssueRepo.create.mockResolvedValue(rawIssue());

    const { issue, isDuplicate } = await issueService.createIssue(
      { reporterId: 'cust1', category: 'product', subCategory: 'incorrect_price', entityType: 'product', entityId: 'prod1', description: 'wrong price shown', metadata: { productName: 'Gold Ring' } },
      'user1'
    );

    expect(issue.issueNumber).toBe('ISS-0000001');
    expect(isDuplicate).toBe(false);
    expect(mockActivityLog.record).toHaveBeenCalledWith(expect.objectContaining({ module: 'issue', action: 'issue.created' }));
  });

  it('returns the existing issue instead of creating a new one within the dedup window', async () => {
    const existing = rawIssue({ issueNumber: 'ISS-0000000' });
    mockIssueRepo.findRecentDuplicate.mockResolvedValue(existing);
    mockIssueRepo.findById.mockResolvedValue(existing);

    const { issue, isDuplicate } = await issueService.createIssue(
      { reporterId: 'cust1', category: 'product', entityType: 'product', entityId: 'prod1', description: 'still wrong' },
      'user1'
    );

    expect(isDuplicate).toBe(true);
    expect(issue).toBe(existing);
    expect(mockIssueRepo.create).not.toHaveBeenCalled();
  });

  it('uploads attachments against the newly created issue and saves them', async () => {
    const issue = rawIssue();
    mockNumbering.getNextIssueNumber.mockResolvedValue('ISS-0000002');
    mockIssueRepo.create.mockResolvedValue(issue);

    await issueService.createIssue(
      { reporterId: 'cust1', category: 'order', description: 'damaged item', attachmentFiles: [{ originalname: 'photo.jpg' }] },
      'user1'
    );

    expect(mockUploadAttachments).toHaveBeenCalledWith([{ originalname: 'photo.jpg' }], 'issue_report', 'issue1', 'user1');
    expect(issue.attachments).toEqual(['media1']);
    expect(issue.save).toHaveBeenCalled();
  });
});

describe('issue.service#updateStatus', () => {
  it('stamps resolvedAt when moving to a terminal status', async () => {
    mockIssueRepo.findRawById.mockResolvedValue(rawIssue({ status: ISSUE_STATUSES.UNDER_REVIEW }));
    mockIssueRepo.updateById.mockResolvedValue(rawIssue({ status: ISSUE_STATUSES.RESOLVED, resolvedAt: new Date() }));

    await issueService.updateStatus('issue1', ISSUE_STATUSES.RESOLVED, 'agent1', { resolutionNote: 'Fixed the listing' });

    expect(mockIssueRepo.updateById).toHaveBeenCalledWith('issue1', expect.objectContaining({ status: ISSUE_STATUSES.RESOLVED, resolutionNote: 'Fixed the listing', resolvedAt: expect.any(Date) }));
  });

  it('notifies the reporter when the status changes and a reporter is populated', async () => {
    mockIssueRepo.findRawById.mockResolvedValue(rawIssue());
    const customer = { _id: 'cust1', email: 'a@b.com', phone: '9999900001' };
    mockIssueRepo.updateById.mockResolvedValue(rawIssue({ status: ISSUE_STATUSES.RESOLVED, reporterId: customer }));

    await issueService.updateStatus('issue1', ISSUE_STATUSES.RESOLVED, 'agent1');

    expect(mockIssueNotifications.notifyStatusChanged).toHaveBeenCalledWith(customer, expect.objectContaining({ status: ISSUE_STATUSES.RESOLVED }), ISSUE_STATUSES.RESOLVED);
  });

  it('throws 404 for a missing issue', async () => {
    mockIssueRepo.findRawById.mockResolvedValue(null);
    await expect(issueService.updateStatus('nope', ISSUE_STATUSES.RESOLVED, 'agent1')).rejects.toMatchObject({ statusCode: 404 });
  });
});

describe('issue.service#getMyIssue (ownership scoping)', () => {
  it('404s when the issue belongs to a different reporter', async () => {
    mockIssueRepo.findById.mockResolvedValue(rawIssue({ reporterId: { id: 'someone-else' } }));
    await expect(issueService.getMyIssue('cust1', 'issue1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns the issue when it belongs to the reporter', async () => {
    mockIssueRepo.findById.mockResolvedValue(rawIssue({ reporterId: { id: 'cust1' } }));
    const issue = await issueService.getMyIssue('cust1', 'issue1');
    expect(issue.issueNumber).toBe('ISS-0000001');
  });
});
