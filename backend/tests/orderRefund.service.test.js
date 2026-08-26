import { jest } from '@jest/globals';

const mockOrderRepo = { findRawById: jest.fn(), findById: jest.fn() };
const mockOrderRefundRepo = {
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  sumCompletedByOrder: jest.fn(),
};
const mockOrderPaymentRepo = { sumPaidByOrder: jest.fn(), findByOrder: jest.fn() };
const mockOrderAudit = { record: jest.fn() };
const mockOrderNotifications = { notify: jest.fn() };
const mockAccountingEvents = { recordSaleRefund: jest.fn() };
const mockRazorpayService = { isConfigured: jest.fn(), refundPayment: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/order/order.repository.js', () => ({ orderRepository: mockOrderRepo }));
jest.unstable_mockModule('../src/modules/order/orderRefund.repository.js', () => ({ orderRefundRepository: mockOrderRefundRepo }));
jest.unstable_mockModule('../src/modules/order/orderPayment.repository.js', () => ({ orderPaymentRepository: mockOrderPaymentRepo }));
jest.unstable_mockModule('../src/modules/order/order.audit.js', () => ({ orderAudit: mockOrderAudit }));
jest.unstable_mockModule('../src/modules/order/order.notifications.js', () => ({ orderNotifications: mockOrderNotifications }));
jest.unstable_mockModule('../src/modules/order/razorpay.service.js', () => ({ razorpayService: mockRazorpayService }));
// Mocked to avoid loading account.model.js for real (same class of bug as
// order.service.test.js).
jest.unstable_mockModule('../src/modules/accounting/accountingEvents.service.js', () => ({ accountingEvents: mockAccountingEvents }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { orderRefundService } = await import('../src/modules/order/orderRefund.service.js');

beforeEach(() => {
  [mockOrderRepo, mockOrderRefundRepo, mockOrderPaymentRepo, mockOrderAudit, mockOrderNotifications, mockAccountingEvents, mockRazorpayService, mockSession].forEach(
    (mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.())
  );
  // Default: no gateway payment on file (COD/manual order) - the same
  // status-only refund behavior every existing test below already expects.
  mockOrderPaymentRepo.findByOrder.mockResolvedValue([]);
});

describe('orderRefundService.createRefund', () => {
  it('rejects a refund that exceeds the refundable balance', async () => {
    mockOrderRepo.findRawById.mockResolvedValue({ _id: 'o1' });
    mockOrderPaymentRepo.sumPaidByOrder.mockResolvedValue(500);
    mockOrderRefundRepo.sumCompletedByOrder.mockResolvedValue(200);

    await expect(orderRefundService.createRefund('o1', { type: 'partial', amount: 400 }, 'u1')).rejects.toThrow(
      'exceeds refundable balance'
    );
    expect(mockOrderRefundRepo.create).not.toHaveBeenCalled();
  });

  it('creates a pending refund when within the refundable balance', async () => {
    mockOrderRepo.findRawById.mockResolvedValue({ _id: 'o1' });
    mockOrderPaymentRepo.sumPaidByOrder.mockResolvedValue(500);
    mockOrderRefundRepo.sumCompletedByOrder.mockResolvedValue(0);
    mockOrderRefundRepo.create.mockResolvedValue({ _id: 'ref1', status: 'pending' });

    const result = await orderRefundService.createRefund('o1', { type: 'full', amount: 500 }, 'u1');
    expect(result.status).toBe('pending');
  });
});

describe('orderRefundService.processRefund', () => {
  it('rolls Order.paymentStatus to refunded when the full paid amount has now been refunded', async () => {
    const refund = { _id: 'ref1', order: 'o1', status: 'pending', amount: 500, save: jest.fn() };
    mockOrderRefundRepo.findById.mockResolvedValue(refund);
    const order = { _id: 'o1', orderNumber: 'ORD-1', save: jest.fn() };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderPaymentRepo.sumPaidByOrder.mockResolvedValue(500);
    mockOrderRefundRepo.sumCompletedByOrder.mockResolvedValue(500);
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderRefundService.processRefund('ref1', { refundReference: 'rzp_refund_1' }, 'u1');

    expect(refund.status).toBe('completed');
    expect(order.paymentStatus).toBe('refunded');
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('rolls Order.paymentStatus to partially_refunded for a partial refund', async () => {
    const refund = { _id: 'ref1', order: 'o1', status: 'pending', amount: 200, save: jest.fn() };
    mockOrderRefundRepo.findById.mockResolvedValue(refund);
    const order = { _id: 'o1', orderNumber: 'ORD-1', save: jest.fn() };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderPaymentRepo.sumPaidByOrder.mockResolvedValue(500);
    mockOrderRefundRepo.sumCompletedByOrder.mockResolvedValue(200);
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderRefundService.processRefund('ref1', {}, 'u1');

    expect(order.paymentStatus).toBe('partially_refunded');
  });

  it('rejects processing a refund that is not pending', async () => {
    mockOrderRefundRepo.findById.mockResolvedValue({ _id: 'ref1', status: 'completed' });

    // Caught by the pre-transaction check now (see processRefund's own
    // comment on why the pending-status check happens before any DB
    // transaction or gateway call starts) - no transaction is ever opened
    // for this path, so there's nothing to abort.
    await expect(orderRefundService.processRefund('ref1', {}, 'u1')).rejects.toThrow('already completed');
    expect(mockSession.startTransaction).not.toHaveBeenCalled();
  });
});

describe('orderRefundService.processRefund - gateway refund', () => {
  const buildRefund = (overrides = {}) => ({ _id: 'ref1', order: 'o1', status: 'pending', amount: 500, save: jest.fn(), ...overrides });
  const buildOrder = (overrides = {}) => ({ _id: 'o1', orderNumber: 'ORD-1', save: jest.fn(), ...overrides });

  it('calls the real Razorpay refund API when the order was paid through the gateway, and uses its refund id as the reference', async () => {
    const refund = buildRefund();
    mockOrderRefundRepo.findById.mockResolvedValue(refund);
    const order = buildOrder();
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderPaymentRepo.findByOrder.mockResolvedValue([{ status: 'paid', gatewayPaymentId: 'pay_abc123' }]);
    mockRazorpayService.isConfigured.mockReturnValue(true);
    mockRazorpayService.refundPayment.mockResolvedValue({ id: 'rfnd_xyz789' });
    mockOrderPaymentRepo.sumPaidByOrder.mockResolvedValue(500);
    mockOrderRefundRepo.sumCompletedByOrder.mockResolvedValue(500);
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderRefundService.processRefund('ref1', { refundReference: 'admin-typed-ref' }, 'u1');

    expect(mockRazorpayService.refundPayment).toHaveBeenCalledWith(
      expect.objectContaining({ paymentId: 'pay_abc123', amount: 500 })
    );
    // The real gateway refund id wins over whatever the admin typed in.
    expect(refund.refundReference).toBe('rfnd_xyz789');
  });

  it('falls back to a manual/status-only refund when Razorpay is not configured, even for a gateway-paid order', async () => {
    const refund = buildRefund();
    mockOrderRefundRepo.findById.mockResolvedValue(refund);
    const order = buildOrder();
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderPaymentRepo.findByOrder.mockResolvedValue([{ status: 'paid', gatewayPaymentId: 'pay_abc123' }]);
    mockRazorpayService.isConfigured.mockReturnValue(false);
    mockOrderPaymentRepo.sumPaidByOrder.mockResolvedValue(500);
    mockOrderRefundRepo.sumCompletedByOrder.mockResolvedValue(500);
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderRefundService.processRefund('ref1', { refundReference: 'admin-typed-ref' }, 'u1');

    expect(mockRazorpayService.refundPayment).not.toHaveBeenCalled();
    expect(refund.refundReference).toBe('admin-typed-ref');
  });

  it('never marks the refund completed if the real gateway refund call fails', async () => {
    mockOrderRefundRepo.findById.mockResolvedValue(buildRefund());
    mockOrderRepo.findRawById.mockResolvedValue(buildOrder());
    mockOrderPaymentRepo.findByOrder.mockResolvedValue([{ status: 'paid', gatewayPaymentId: 'pay_abc123' }]);
    mockRazorpayService.isConfigured.mockReturnValue(true);
    mockRazorpayService.refundPayment.mockRejectedValue(new Error('Razorpay rejected the refund'));

    await expect(orderRefundService.processRefund('ref1', {}, 'u1')).rejects.toThrow('Razorpay rejected the refund');
    expect(mockSession.startTransaction).not.toHaveBeenCalled();
  });

  it('never calls the gateway for a COD/manual order (no gatewayPaymentId on file)', async () => {
    const refund = buildRefund();
    mockOrderRefundRepo.findById.mockResolvedValue(refund);
    const order = buildOrder();
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderPaymentRepo.findByOrder.mockResolvedValue([{ status: 'paid', gatewayPaymentId: null }]);
    mockOrderPaymentRepo.sumPaidByOrder.mockResolvedValue(500);
    mockOrderRefundRepo.sumCompletedByOrder.mockResolvedValue(500);
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderRefundService.processRefund('ref1', { refundReference: 'cod-manual-ref' }, 'u1');

    expect(mockRazorpayService.refundPayment).not.toHaveBeenCalled();
    expect(refund.refundReference).toBe('cod-manual-ref');
  });
});
