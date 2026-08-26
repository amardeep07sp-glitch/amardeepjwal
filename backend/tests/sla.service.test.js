import { jest } from '@jest/globals';

const mockSlaPolicyRepo = { getOrCreate: jest.fn(), update: jest.fn() };
const mockActivityLog = { record: jest.fn() };

// SupportTicket itself is a real mongoose model (no DB in this unit-test
// setup) - sweepBreaches() is exercised against a stubbed model instead of
// pulling in a live connection, same reasoning as every other jest.mock in
// this suite that avoids touching a real Mongoose model.
const mockSupportTicket = { find: jest.fn(), updateMany: jest.fn() };

jest.unstable_mockModule('../src/modules/support/slaPolicy.repository.js', () => ({ slaPolicyRepository: mockSlaPolicyRepo }));
jest.unstable_mockModule('../src/modules/activityLog/activityLog.service.js', () => ({ activityLogService: mockActivityLog }));
jest.unstable_mockModule('../src/modules/support/supportTicket.model.js', () => ({ SupportTicket: mockSupportTicket }));

const { slaService } = await import('../src/modules/support/sla.service.js');
const { TICKET_PRIORITIES } = await import('../src/modules/support/support.constants.js');

beforeEach(() => {
  [mockSlaPolicyRepo, mockActivityLog, mockSupportTicket].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset()));
});

describe('slaService.computeDeadlines', () => {
  it('adds the tier minutes onto the given fromDate, never "now"', async () => {
    mockSlaPolicyRepo.getOrCreate.mockResolvedValue({
      tiers: [{ priority: TICKET_PRIORITIES.URGENT, firstResponseMins: 120, resolutionMins: 120 }],
    });

    const from = new Date('2026-01-01T00:00:00.000Z');
    const { firstResponseDueAt, resolutionDueAt } = await slaService.computeDeadlines(TICKET_PRIORITIES.URGENT, from);

    expect(firstResponseDueAt.toISOString()).toBe('2026-01-01T02:00:00.000Z');
    expect(resolutionDueAt.toISOString()).toBe('2026-01-01T02:00:00.000Z');
  });

  it('returns null deadlines for a priority with no configured tier', async () => {
    mockSlaPolicyRepo.getOrCreate.mockResolvedValue({ tiers: [] });

    const result = await slaService.computeDeadlines(TICKET_PRIORITIES.LOW, new Date());

    expect(result).toEqual({ firstResponseDueAt: null, resolutionDueAt: null });
  });
});

describe('slaService.sweepBreaches', () => {
  it('marks overdue tickets breached and logs one activity entry per ticket', async () => {
    const overdue = [{ _id: 't1', ticketNumber: 'TKT-1' }, { _id: 't2', ticketNumber: 'TKT-2' }];
    mockSupportTicket.find.mockReturnValue({ select: jest.fn().mockResolvedValue(overdue) });
    mockSupportTicket.updateMany.mockResolvedValue({});

    const count = await slaService.sweepBreaches();

    expect(count).toBe(2);
    expect(mockSupportTicket.updateMany).toHaveBeenCalledWith(
      { _id: { $in: ['t1', 't2'] } },
      expect.objectContaining({ slaBreached: true, slaBreachedAt: expect.any(Date) })
    );
    expect(mockActivityLog.record).toHaveBeenCalledTimes(2);
  });

  it('is a no-op when nothing is overdue', async () => {
    mockSupportTicket.find.mockReturnValue({ select: jest.fn().mockResolvedValue([]) });

    const count = await slaService.sweepBreaches();

    expect(count).toBe(0);
    expect(mockSupportTicket.updateMany).not.toHaveBeenCalled();
  });
});
