import { jest } from '@jest/globals';

const mockEvent = { countDocuments: jest.fn(), distinct: jest.fn() };
const mockOrderRepo = { countReturningCustomers: jest.fn() };
const mockSessionService = { getActiveSessionCount: jest.fn() };
const mockVisitorAnalytics = { getEngagementSummary: jest.fn() };
const mockSearchAnalytics = {};
const mockProductAnalytics = {};
const mockCategoryAnalytics = {};
const mockMarketingAnalytics = {};
const mockFunnelAnalytics = {};

jest.unstable_mockModule('../src/modules/cip/event.model.js', () => ({ Event: mockEvent }));
jest.unstable_mockModule('../src/modules/order/order.repository.js', () => ({ orderRepository: mockOrderRepo }));
jest.unstable_mockModule('../src/modules/cip/session.service.js', () => ({ sessionService: mockSessionService }));
jest.unstable_mockModule('../src/modules/cip/visitorAnalytics.service.js', () => ({ visitorAnalyticsService: mockVisitorAnalytics }));
jest.unstable_mockModule('../src/modules/cip/searchAnalytics.service.js', () => ({ searchAnalyticsService: mockSearchAnalytics }));
jest.unstable_mockModule('../src/modules/cip/productAnalytics.service.js', () => ({ productAnalyticsService: mockProductAnalytics }));
jest.unstable_mockModule('../src/modules/cip/categoryAnalytics.service.js', () => ({ categoryAnalyticsService: mockCategoryAnalytics }));
jest.unstable_mockModule('../src/modules/cip/marketingAnalytics.service.js', () => ({ marketingAnalyticsService: mockMarketingAnalytics }));
jest.unstable_mockModule('../src/modules/cip/funnelAnalytics.service.js', () => ({ funnelAnalyticsService: mockFunnelAnalytics }));

const { executiveCipDashboardService } = await import('../src/modules/cip/executiveCipDashboard.service.js');

beforeEach(() => {
  mockEvent.countDocuments.mockReset().mockResolvedValue(5);
  mockEvent.distinct.mockReset().mockImplementation((field, match) => Promise.resolve(match?.eventType === 'order_placed' ? ['s1'] : ['s1', 's2']));
  mockOrderRepo.countReturningCustomers.mockReset().mockResolvedValue(3);
  mockSessionService.getActiveSessionCount.mockReset().mockResolvedValue(7);
  mockVisitorAnalytics.getEngagementSummary.mockReset().mockResolvedValue({ totalSessions: 40, bouncedSessions: 10, bounceRate: 25, averageDurationSeconds: 150 });
});

describe('executiveCipDashboardService.getDashboardCards', () => {
  it('includes bounce rate and average session duration (in minutes) alongside the existing cards', async () => {
    const cards = await executiveCipDashboardService.getDashboardCards();

    expect(cards.bounceRate).toBe(25);
    expect(cards.avgSessionMinutes).toBe(2.5);
    expect(cards.activeSessions).toBe(7);
    expect(cards.todaysSearches).toBe(5);
    expect(cards.returningCustomers).toBe(3);
  });
});
