import { jest } from '@jest/globals';

const mockOrderRepo = { findRawById: jest.fn(), findById: jest.fn() };
const mockOrderPaymentRepo = {
  create: jest.fn(),
  findByGatewayPaymentId: jest.fn(),
  findByGatewayOrderId: jest.fn(),
  sumPaidByOrder: jest.fn(),
};
const mockOrderAudit = { record: jest.fn() };
const mockOrderNotifications = { notify: jest.fn() };
const mockRazorpayService = {
  isConfigured: jest.fn(),
  createOrder: jest.fn(),
  verifyWebhookSignature: jest.fn(),
  verifyPaymentSignature: jest.fn(),
};
const mockAccountingEvents = { recordSalePayment: jest.fn() };
const mockSupportAutomation = { onPaymentFailed: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/order/order.repository.js', () => ({ orderRepository: mockOrderRepo }));
jest.unstable_mockModule('../src/modules/order/orderPayment.repository.js', () => ({ orderPaymentRepository: mockOrderPaymentRepo }));
jest.unstable_mockModule('../src/modules/order/order.audit.js', () => ({ orderAudit: mockOrderAudit }));
jest.unstable_mockModule('../src/modules/order/order.notifications.js', () => ({ orderNotifications: mockOrderNotifications }));
jest.unstable_mockModule('../src/modules/order/razorpay.service.js', () => ({ razorpayService: mockRazorpayService }));
// Mocked to avoid loading account.model.js for real - it calls
// `new mongoose.Schema(...)` at module-load time, and mongoose is mocked below.
jest.unstable_mockModule('../src/modules/accounting/accountingEvents.service.js', () => ({ accountingEvents: mockAccountingEvents }));
// Mocked for the same reason as accountingEvents.service.js above -
// supportAutomation.service.js transitively loads issueReport.model.js/
// orderRefund.model.js/orderShipment.model.js, each calling `new
// mongoose.Schema(...)` at module-load time.
jest.unstable_mockModule('../src/modules/support/supportAutomation.service.js', () => ({ supportAutomation: mockSupportAutomation }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { orderPaymentService } = await import('../src/modules/order/orderPayment.service.js');

beforeEach(() => {
  [mockOrderRepo, mockOrderPaymentRepo, mockOrderAudit, mockOrderNotifications, mockRazorpayService, mockAccountingEvents, mockSupportAutomation, mockSession].forEach(
    (mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.())
  );
});

describe('orderPaymentService.finalizeRazorpayPayment - idempotency', () => {
  it('is a no-op if this gatewayPaymentId was already processed (prevents double payment processing)', async () => {
    const existingPayment = { _id: 'pay1', order: 'o1', status: 'paid' };
    mockOrderPaymentRepo.findByGatewayPaymentId.mockResolvedValue(existingPayment);

    const result = await orderPaymentService.finalizeRazorpayPayment(
      { razorpayOrderId: 'rzp_order_1', razorpayPaymentId: 'rzp_pay_1', razorpaySignature: 'sig' },
      'u1'
    );

    expect(result).toBe(existingPayment);
    expect(mockOrderPaymentRepo.findByGatewayOrderId).not.toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('marks the pending payment paid and rolls Order.paymentStatus up to paid when fully covered', async () => {
    mockOrderPaymentRepo.findByGatewayPaymentId.mockResolvedValue(null);
    const payment = { _id: 'pay1', order: 'o1', amount: 500, save: jest.fn() };
    mockOrderPaymentRepo.findByGatewayOrderId.mockResolvedValue(payment);
    mockOrderRepo.findRawById.mockResolvedValue({ _id: 'o1', grandTotal: 500, orderNumber: 'ORD-1', save: jest.fn() });
    mockOrderPaymentRepo.sumPaidByOrder.mockResolvedValue(500);
    mockOrderRepo.findById.mockResolvedValue({ _id: 'o1', customer: null });

    await orderPaymentService.finalizeRazorpayPayment(
      { razorpayOrderId: 'rzp_order_1', razorpayPaymentId: 'rzp_pay_1', razorpaySignature: 'sig' },
      'u1'
    );

    expect(payment.status).toBe('paid');
    expect(payment.gatewayPaymentId).toBe('rzp_pay_1');
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockOrderNotifications.notify).toHaveBeenCalledWith('paid', expect.anything(), null);
  });

  it('throws and aborts if no pending payment matches the gatewayOrderId', async () => {
    mockOrderPaymentRepo.findByGatewayPaymentId.mockResolvedValue(null);
    mockOrderPaymentRepo.findByGatewayOrderId.mockResolvedValue(null);

    await expect(
      orderPaymentService.finalizeRazorpayPayment(
        { razorpayOrderId: 'rzp_order_missing', razorpayPaymentId: 'rzp_pay_1' },
        'u1'
      )
    ).rejects.toThrow('No payment record found');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});

describe('orderPaymentService.verifyRazorpayPayment', () => {
  it('rejects an invalid signature without touching any payment record', async () => {
    mockRazorpayService.verifyPaymentSignature.mockReturnValue(false);

    await expect(
      orderPaymentService.verifyRazorpayPayment(
        { razorpayOrderId: 'o1', razorpayPaymentId: 'p1', razorpaySignature: 'bad' },
        'u1'
      )
    ).rejects.toThrow('signature verification failed');

    expect(mockOrderPaymentRepo.findByGatewayPaymentId).not.toHaveBeenCalled();
  });
});

describe('orderPaymentService.handleWebhookEvent - payment.failed automation', () => {
  it('marks a pending payment failed and flags an automated issue report', async () => {
    const payment = { _id: 'pay1', order: 'o1', status: 'pending', save: jest.fn() };
    mockOrderPaymentRepo.findByGatewayOrderId.mockResolvedValue(payment);
    mockOrderRepo.findRawById.mockResolvedValue({ _id: 'o1', customer: 'cust1', orderNumber: 'ORD-1' });

    await orderPaymentService.handleWebhookEvent({
      event: 'payment.failed',
      payload: { payment: { entity: { order_id: 'razorpay_order_1', id: 'razorpay_pay_1' } } },
    });

    expect(payment.status).toBe('failed');
    expect(payment.save).toHaveBeenCalled();
    expect(mockSupportAutomation.onPaymentFailed).toHaveBeenCalledWith({ orderId: 'o1', customerId: 'cust1', orderNumber: 'ORD-1' });
  });

  it('is a no-op when the payment is already resolved (not pending)', async () => {
    const payment = { _id: 'pay1', order: 'o1', status: 'paid', save: jest.fn() };
    mockOrderPaymentRepo.findByGatewayOrderId.mockResolvedValue(payment);

    await orderPaymentService.handleWebhookEvent({
      event: 'payment.failed',
      payload: { payment: { entity: { order_id: 'razorpay_order_1', id: 'razorpay_pay_1' } } },
    });

    expect(payment.save).not.toHaveBeenCalled();
    expect(mockSupportAutomation.onPaymentFailed).not.toHaveBeenCalled();
  });
});

describe('orderPaymentService.recordManualPayment', () => {
  it('records a paid payment and recomputes payment status as partially_paid when under grandTotal', async () => {
    const order = { _id: 'o1', grandTotal: 1000, orderNumber: 'ORD-1', save: jest.fn() };
    mockOrderRepo.findRawById.mockResolvedValue(order);
    mockOrderPaymentRepo.create.mockResolvedValue({ _id: 'pay1', amount: 400 });
    mockOrderPaymentRepo.sumPaidByOrder.mockResolvedValue(400);
    mockOrderRepo.findById.mockResolvedValue({ ...order, customer: null });

    await orderPaymentService.recordManualPayment('o1', { method: 'cash', amount: 400 }, 'u1');

    expect(order.paymentStatus).toBe('partially_paid');
    expect(order.paymentMethod).toBe('cash');
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });
});
