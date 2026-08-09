import { jest } from '@jest/globals';

const mockSessionRepo = {
  findBySessionId: jest.fn(),
  create: jest.fn(),
  recordActivity: jest.fn(),
  recordLogin: jest.fn(),
  recordLogout: jest.fn(),
  closeById: jest.fn(),
  findStale: jest.fn(),
  countActive: jest.fn(),
  findPaginated: jest.fn(),
};
const mockVisitorService = { recordNewSession: jest.fn() };

jest.unstable_mockModule('../src/modules/cip/session.repository.js', () => ({ sessionRepository: mockSessionRepo }));
jest.unstable_mockModule('../src/modules/cip/visitor.service.js', () => ({ visitorService: mockVisitorService }));

const { sessionService } = await import('../src/modules/cip/session.service.js');

beforeEach(() => {
  [mockSessionRepo, mockVisitorService].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset()));
});

describe('sessionService.getOrCreateSession', () => {
  it('creates a new session and bumps the visitor session count when none exists yet', async () => {
    mockSessionRepo.findBySessionId.mockResolvedValue(null);
    mockVisitorService.recordNewSession.mockResolvedValue({ isReturning: false });
    mockSessionRepo.create.mockResolvedValue({ sessionId: 's1' });

    await sessionService.getOrCreateSession({ sessionId: 's1', visitorId: 'v1', isPageView: true });

    expect(mockVisitorService.recordNewSession).toHaveBeenCalledWith('v1');
    expect(mockSessionRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 's1', visitorId: 'v1', isReturning: false, pageViewCount: 1, eventCount: 1 })
    );
    expect(mockSessionRepo.recordActivity).not.toHaveBeenCalled();
  });

  it('marks a session as returning when the visitor has been seen before', async () => {
    mockSessionRepo.findBySessionId.mockResolvedValue(null);
    mockVisitorService.recordNewSession.mockResolvedValue({ isReturning: true });
    mockSessionRepo.create.mockResolvedValue({ sessionId: 's1' });

    await sessionService.getOrCreateSession({ sessionId: 's1', visitorId: 'v1', isPageView: false });

    expect(mockSessionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ isReturning: true, pageViewCount: 0 }));
  });

  it('just records activity on an existing session, never creating a duplicate', async () => {
    mockSessionRepo.findBySessionId.mockResolvedValue({ sessionId: 's1' });

    await sessionService.getOrCreateSession({ sessionId: 's1', visitorId: 'v1', isPageView: true });

    expect(mockSessionRepo.recordActivity).toHaveBeenCalledWith('s1', { isPageView: true });
    expect(mockSessionRepo.create).not.toHaveBeenCalled();
    expect(mockVisitorService.recordNewSession).not.toHaveBeenCalled();
  });
});

describe('sessionService.closeSession / _finalize', () => {
  it('computes duration and flags a bounce for a single-page-view, short session', async () => {
    const startTime = new Date(Date.now() - 5000); // 5 seconds ago
    mockSessionRepo.findBySessionId.mockResolvedValue({ sessionId: 's1', startTime, pageViewCount: 1, endTime: null });

    await sessionService.closeSession('s1');

    expect(mockSessionRepo.closeById).toHaveBeenCalledWith('s1', expect.objectContaining({ isBounce: true }));
    const [, patch] = mockSessionRepo.closeById.mock.calls[0];
    expect(patch.durationSeconds).toBeGreaterThanOrEqual(4);
    expect(patch.durationSeconds).toBeLessThanOrEqual(6);
  });

  it('does not flag a bounce for a session with multiple page views', async () => {
    const startTime = new Date(Date.now() - 2000);
    mockSessionRepo.findBySessionId.mockResolvedValue({ sessionId: 's1', startTime, pageViewCount: 3, endTime: null });

    await sessionService.closeSession('s1');

    expect(mockSessionRepo.closeById).toHaveBeenCalledWith('s1', expect.objectContaining({ isBounce: false }));
  });

  it('is a no-op for a session that is already closed', async () => {
    mockSessionRepo.findBySessionId.mockResolvedValue({ sessionId: 's1', endTime: new Date() });

    await sessionService.closeSession('s1');

    expect(mockSessionRepo.closeById).not.toHaveBeenCalled();
  });
});

describe('sessionService.closeStaleSessions', () => {
  it('finalizes every stale session found', async () => {
    mockSessionRepo.findStale.mockResolvedValue([
      { sessionId: 's1', startTime: new Date(Date.now() - 60000), pageViewCount: 1 },
      { sessionId: 's2', startTime: new Date(Date.now() - 120000), pageViewCount: 2 },
    ]);

    const closed = await sessionService.closeStaleSessions();

    expect(closed).toBe(2);
    expect(mockSessionRepo.closeById).toHaveBeenCalledTimes(2);
  });
});

describe('sessionService.getActiveSessionCount', () => {
  it('proxies to the repository with the idle cutoff', async () => {
    mockSessionRepo.countActive.mockResolvedValue(7);
    const count = await sessionService.getActiveSessionCount();
    expect(count).toBe(7);
    expect(mockSessionRepo.countActive).toHaveBeenCalledWith(expect.any(Date));
  });
});
