import { jest } from '@jest/globals';

const mockEvent = { distinct: jest.fn() };

// Mocked to avoid loading event.model.js for real - it calls
// `new mongoose.Schema(...)` at module-load time and pulls in env.js
// (unrelated to what this pure-aggregation-shape test needs).
jest.unstable_mockModule('../src/modules/cip/event.model.js', () => ({ Event: mockEvent }));

const { funnelAnalyticsService } = await import('../src/modules/cip/funnelAnalytics.service.js');

beforeEach(() => {
  mockEvent.distinct.mockReset();
});

describe('funnelAnalyticsService.getFunnel', () => {
  it('computes zero drop-off for the first step and correct drop-off for each step after', async () => {
    // Homepage: 100, Category: 80, Product: 50, Cart: 20, Checkout: 10, Payment: 8, Success: 5
    const counts = [100, 80, 50, 20, 10, 8, 5];
    let call = 0;
    mockEvent.distinct.mockImplementation(() => Promise.resolve(Array.from({ length: counts[call++] })));

    const funnel = await funnelAnalyticsService.getFunnel({});

    expect(funnel).toHaveLength(7);
    expect(funnel[0]).toMatchObject({ key: 'homepage', sessions: 100, dropOffRate: 0 });
    expect(funnel[1]).toMatchObject({ key: 'category', sessions: 80, dropOffRate: 20 });
    expect(funnel[2]).toMatchObject({ key: 'product', sessions: 50, dropOffRate: 37.5 });
    expect(funnel[6]).toMatchObject({ key: 'success', sessions: 5 });
  });

  it('never divides by zero when a step has no sessions at all', async () => {
    mockEvent.distinct.mockResolvedValue([]);

    const funnel = await funnelAnalyticsService.getFunnel({});

    expect(funnel.every((step) => step.dropOffRate === 0)).toBe(true);
  });

  it('passes the homepage step a pageType filter but no other step', async () => {
    mockEvent.distinct.mockResolvedValue([]);

    await funnelAnalyticsService.getFunnel({});

    expect(mockEvent.distinct.mock.calls[0][1]).toEqual(expect.objectContaining({ pageType: 'home' }));
    expect(mockEvent.distinct.mock.calls[1][1]).not.toHaveProperty('pageType');
  });
});
