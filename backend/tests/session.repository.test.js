import { jest } from '@jest/globals';

const mockSession = { aggregate: jest.fn() };
jest.unstable_mockModule('../src/modules/cip/session.model.js', () => ({ Session: mockSession }));

const { sessionRepository } = await import('../src/modules/cip/session.repository.js');

beforeEach(() => {
  mockSession.aggregate.mockReset();
});

describe('sessionRepository.getEngagementSummary', () => {
  it('computes bounce rate and average duration from closed sessions', async () => {
    mockSession.aggregate.mockResolvedValue([{ totalSessions: 200, bouncedSessions: 75, totalDurationSeconds: 40000 }]);

    const result = await sessionRepository.getEngagementSummary({});

    expect(result).toEqual({ totalSessions: 200, bouncedSessions: 75, bounceRate: 37.5, averageDurationSeconds: 200 });
  });

  it('only matches closed sessions (endTime not null)', async () => {
    mockSession.aggregate.mockResolvedValue([]);
    await sessionRepository.getEngagementSummary({});
    const pipeline = mockSession.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match.endTime).toEqual({ $ne: null });
  });

  it('returns zeros rather than dividing by zero when there are no closed sessions yet', async () => {
    mockSession.aggregate.mockResolvedValue([]);
    const result = await sessionRepository.getEngagementSummary({});
    expect(result).toEqual({ totalSessions: 0, bouncedSessions: 0, bounceRate: 0, averageDurationSeconds: 0 });
  });

  it('applies the date range to startTime when given', async () => {
    mockSession.aggregate.mockResolvedValue([]);
    await sessionRepository.getEngagementSummary({ dateFrom: '2026-01-01', dateTo: '2026-01-31' });
    const pipeline = mockSession.aggregate.mock.calls[0][0];
    expect(pipeline[0].$match.startTime.$gte).toEqual(new Date('2026-01-01'));
    expect(pipeline[0].$match.startTime.$lte).toEqual(new Date('2026-01-31'));
  });
});
