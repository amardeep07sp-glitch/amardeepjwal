import { jest } from '@jest/globals';

const mockEventRepo = { create: jest.fn() };
const mockSessionService = { getOrCreateSession: jest.fn(), recordLogin: jest.fn(), recordLogout: jest.fn(), closeSession: jest.fn() };
const mockVisitorService = { touch: jest.fn(), linkCustomer: jest.fn(), markGuestCheckout: jest.fn() };
const mockConsentService = { hasAnalyticsConsent: jest.fn() };
const mockResolveLocationFromIp = jest.fn();
const mockResolveTrafficSource = jest.fn(() => 'direct');

jest.unstable_mockModule('../src/modules/cip/event.repository.js', () => ({ eventRepository: mockEventRepo }));
jest.unstable_mockModule('../src/modules/cip/session.service.js', () => ({ sessionService: mockSessionService }));
jest.unstable_mockModule('../src/modules/cip/visitor.service.js', () => ({ visitorService: mockVisitorService }));
jest.unstable_mockModule('../src/modules/cip/consent.service.js', () => ({ consentService: mockConsentService }));
// Mocked because resolveLocationFromIp now does real I/O (Redis cache +
// an external geo-IP HTTP call) - a unit test must never hit either. No
// test here asserts on the exact traffic.source classification, so
// resolveTrafficSource is stubbed too rather than kept real.
jest.unstable_mockModule('../src/modules/cip/geo.util.js', () => ({
  resolveLocationFromIp: mockResolveLocationFromIp,
  resolveTrafficSource: mockResolveTrafficSource,
}));

const { eventService } = await import('../src/modules/cip/event.service.js');

beforeEach(() => {
  [mockEventRepo, mockSessionService, mockVisitorService, mockConsentService].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset()));
  mockResolveLocationFromIp.mockReset().mockImplementation(() => ({ country: '', state: '', city: '', approxLat: null, approxLng: null, timezone: '' }));
  mockResolveTrafficSource.mockReset().mockReturnValue('direct');
  mockConsentService.hasAnalyticsConsent.mockResolvedValue(true);
  mockEventRepo.create.mockImplementation((data) => Promise.resolve({ _id: 'evt1', ...data }));
});

describe('eventService.trackEvent - validation and consent', () => {
  it('rejects an unrecognized event type without persisting anything', async () => {
    const result = await eventService.trackEvent({ eventType: 'not_a_real_event', sessionId: 's1', visitorId: 'v1' }, {});
    expect(result).toBeNull();
    expect(mockEventRepo.create).not.toHaveBeenCalled();
  });

  it('returns null and persists nothing when analytics consent was declined', async () => {
    mockConsentService.hasAnalyticsConsent.mockResolvedValue(false);

    const result = await eventService.trackEvent({ eventType: 'page_view', sessionId: 's1', visitorId: 'v1' }, {});

    expect(result).toBeNull();
    expect(mockEventRepo.create).not.toHaveBeenCalled();
    expect(mockVisitorService.touch).not.toHaveBeenCalled();
  });
});

describe('eventService.trackEvent - metadata sanitization', () => {
  it('strips any key that looks like a password/OTP/payment field before persisting', async () => {
    await eventService.trackEvent(
      {
        eventType: 'checkout_started',
        sessionId: 's1',
        visitorId: 'v1',
        metadata: { cartValue: 500, password: 'hunter2', otpCode: '123456', cardNumber: '4111111111111111', nested: { authToken: 'abc' } },
      },
      {}
    );

    const [createdData] = mockEventRepo.create.mock.calls[0];
    expect(createdData.metadata).toEqual({ cartValue: 500, nested: {} });
  });
});

describe('eventService.trackEvent - session/visitor identity resolution', () => {
  it('touches the visitor and resolves the session for every event', async () => {
    await eventService.trackEvent({ eventType: 'page_view', sessionId: 's1', visitorId: 'v1', pageType: 'home' }, { userAgent: 'test-agent', ip: '1.2.3.4' });

    expect(mockVisitorService.touch).toHaveBeenCalledWith('v1', expect.any(Object));
    expect(mockSessionService.getOrCreateSession).toHaveBeenCalledWith(
      expect.objectContaining({ sessionId: 's1', visitorId: 'v1', isPageView: true })
    );
  });

  it('links the customer and records login on a login event', async () => {
    await eventService.trackEvent({ eventType: 'login', sessionId: 's1', visitorId: 'v1', customerId: 'c1' }, {});

    expect(mockVisitorService.linkCustomer).toHaveBeenCalledWith('v1', 'c1');
    expect(mockSessionService.recordLogin).toHaveBeenCalledWith('s1', 'c1', 'customer');
  });

  it('records logout and closes the session on a logout event', async () => {
    await eventService.trackEvent({ eventType: 'logout', sessionId: 's1', visitorId: 'v1' }, {});

    expect(mockSessionService.recordLogout).toHaveBeenCalledWith('s1');
    expect(mockSessionService.closeSession).toHaveBeenCalledWith('s1');
  });

  it('resolves visitorType to "customer" when a customerId is present, "anonymous" otherwise', async () => {
    await eventService.trackEvent({ eventType: 'page_view', sessionId: 's1', visitorId: 'v1', customerId: 'c1' }, {});
    expect(mockEventRepo.create.mock.calls[0][0].visitorType).toBe('customer');

    mockEventRepo.create.mockClear();
    await eventService.trackEvent({ eventType: 'page_view', sessionId: 's2', visitorId: 'v2' }, {});
    expect(mockEventRepo.create.mock.calls[0][0].visitorType).toBe('anonymous');
  });
});
