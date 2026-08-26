import { jest } from '@jest/globals';

const mockIssueService = { createIssue: jest.fn() };
const mockOrderRefundRepo = { findStalePending: jest.fn() };
const mockOrderShipmentRepo = { findDelayedUnnotified: jest.fn(), markDelayNotified: jest.fn() };
const mockCustomerRepo = { findRawById: jest.fn() };
const mockCustomerNotifications = { send: jest.fn() };

jest.unstable_mockModule('../src/modules/issue/issue.service.js', () => ({ issueService: mockIssueService }));
jest.unstable_mockModule('../src/modules/order/orderRefund.repository.js', () => ({ orderRefundRepository: mockOrderRefundRepo }));
jest.unstable_mockModule('../src/modules/order/orderShipment.repository.js', () => ({ orderShipmentRepository: mockOrderShipmentRepo }));
jest.unstable_mockModule('../src/modules/customer/customer.repository.js', () => ({ customerRepository: mockCustomerRepo }));
jest.unstable_mockModule('../src/modules/customer/customer.notifications.js', () => ({ customerNotifications: mockCustomerNotifications }));

const { supportAutomation } = await import('../src/modules/support/supportAutomation.service.js');

beforeEach(() => {
  [mockIssueService, mockOrderRefundRepo, mockOrderShipmentRepo, mockCustomerRepo, mockCustomerNotifications].forEach((mockObj) =>
    Object.values(mockObj).forEach((fn) => fn.mockReset())
  );
  mockIssueService.createIssue.mockResolvedValue({ issue: {}, isDuplicate: false });
});

describe('supportAutomation.onPaymentFailed', () => {
  it('creates an automated payment issue report', async () => {
    await supportAutomation.onPaymentFailed({ orderId: 'o1', customerId: 'cust1', orderNumber: 'ORD-1' });

    expect(mockIssueService.createIssue).toHaveBeenCalledWith(
      expect.objectContaining({ reporterId: 'cust1', category: 'payment', subCategory: 'payment_failed', source: 'automated' }),
      null
    );
  });

  it('never throws even if issue creation fails', async () => {
    mockIssueService.createIssue.mockRejectedValue(new Error('db down'));
    await expect(supportAutomation.onPaymentFailed({ orderId: 'o1', customerId: 'cust1', orderNumber: 'ORD-1' })).resolves.toBeUndefined();
  });
});

describe('supportAutomation.sweepDelayedRefunds', () => {
  it('flags each stale refund as an automated issue and counts only the non-duplicate ones', async () => {
    mockOrderRefundRepo.findStalePending.mockResolvedValue([
      { _id: 'r1', amount: 500, status: 'pending', order: { _id: 'o1', customer: 'cust1', orderNumber: 'ORD-1' } },
      { _id: 'r2', amount: 900, status: 'processing', order: { _id: 'o2', customer: 'cust2', orderNumber: 'ORD-2' } },
    ]);
    mockIssueService.createIssue.mockResolvedValueOnce({ issue: {}, isDuplicate: false }).mockResolvedValueOnce({ issue: {}, isDuplicate: true });

    const flagged = await supportAutomation.sweepDelayedRefunds();

    expect(flagged).toBe(1);
    expect(mockIssueService.createIssue).toHaveBeenCalledTimes(2);
  });

  it('skips refunds whose order has no customer without throwing', async () => {
    mockOrderRefundRepo.findStalePending.mockResolvedValue([{ _id: 'r1', amount: 500, status: 'pending', order: null }]);

    const flagged = await supportAutomation.sweepDelayedRefunds();

    expect(flagged).toBe(0);
    expect(mockIssueService.createIssue).not.toHaveBeenCalled();
  });
});

describe('supportAutomation.sweepDelayedDeliveries', () => {
  it('notifies the customer and marks the shipment notified', async () => {
    mockOrderShipmentRepo.findDelayedUnnotified.mockResolvedValue([
      { _id: 's1', order: { _id: 'o1', customer: 'cust1', orderNumber: 'ORD-1' } },
    ]);
    mockCustomerRepo.findRawById.mockResolvedValue({ _id: 'cust1', email: 'a@b.com' });

    const notified = await supportAutomation.sweepDelayedDeliveries();

    expect(notified).toBe(1);
    expect(mockCustomerNotifications.send).toHaveBeenCalledWith({ _id: 'cust1', email: 'a@b.com' }, expect.objectContaining({ subject: expect.stringContaining('ORD-1') }));
    expect(mockOrderShipmentRepo.markDelayNotified).toHaveBeenCalledWith('s1');
  });

  it('is a no-op when nothing is delayed', async () => {
    mockOrderShipmentRepo.findDelayedUnnotified.mockResolvedValue([]);

    const notified = await supportAutomation.sweepDelayedDeliveries();

    expect(notified).toBe(0);
    expect(mockCustomerNotifications.send).not.toHaveBeenCalled();
  });
});
