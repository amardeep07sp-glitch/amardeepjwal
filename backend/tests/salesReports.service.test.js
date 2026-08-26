import { jest } from '@jest/globals';

const mockOrder = { aggregate: jest.fn() };
const mockOrderItem = { aggregate: jest.fn() };
const mockOrderRepo = {};
const mockOrderRefundRepo = {};

jest.unstable_mockModule('../src/modules/order/order.model.js', () => ({ Order: mockOrder }));
jest.unstable_mockModule('../src/modules/order/orderItem.model.js', () => ({ OrderItem: mockOrderItem }));
jest.unstable_mockModule('../src/modules/order/order.repository.js', () => ({ orderRepository: mockOrderRepo }));
jest.unstable_mockModule('../src/modules/order/orderRefund.repository.js', () => ({ orderRefundRepository: mockOrderRefundRepo }));

const { salesReportsService } = await import('../src/modules/reports/salesReports.service.js');

beforeEach(() => {
  mockOrder.aggregate.mockReset();
});

describe('salesReportsService.getSalesByDate - groupBy', () => {
  it('defaults to a daily $dateToString format', async () => {
    mockOrder.aggregate.mockResolvedValue([]);
    await salesReportsService.getSalesByDate({});
    const pipeline = mockOrder.aggregate.mock.calls[0][0];
    expect(pipeline[1].$group._id.$dateToString.format).toBe('%Y-%m-%d');
  });

  it('uses an ISO week format when groupBy is "week"', async () => {
    mockOrder.aggregate.mockResolvedValue([]);
    await salesReportsService.getSalesByDate({ groupBy: 'week' });
    const pipeline = mockOrder.aggregate.mock.calls[0][0];
    expect(pipeline[1].$group._id.$dateToString.format).toBe('%G-W%V');
  });

  it('uses a year-month format when groupBy is "month"', async () => {
    mockOrder.aggregate.mockResolvedValue([]);
    await salesReportsService.getSalesByDate({ groupBy: 'month' });
    const pipeline = mockOrder.aggregate.mock.calls[0][0];
    expect(pipeline[1].$group._id.$dateToString.format).toBe('%Y-%m');
  });

  it('falls back to daily for an unrecognized groupBy value', async () => {
    mockOrder.aggregate.mockResolvedValue([]);
    await salesReportsService.getSalesByDate({ groupBy: 'nonsense' });
    const pipeline = mockOrder.aggregate.mock.calls[0][0];
    expect(pipeline[1].$group._id.$dateToString.format).toBe('%Y-%m-%d');
  });
});
