import { jest } from '@jest/globals';

const mockPurchaseOrderRepo = { findRawById: jest.fn() };
const mockSupplierPaymentRepo = { create: jest.fn(), findById: jest.fn(), sumPaidByPurchaseOrder: jest.fn() };
const mockSupplierLedgerService = { recordEntry: jest.fn() };
const mockPurchaseAudit = { record: jest.fn() };
const mockAccountingEvents = { recordSupplierPayment: jest.fn(), recordSupplierPaymentRefund: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/purchase/purchaseOrder.repository.js', () => ({ purchaseOrderRepository: mockPurchaseOrderRepo }));
jest.unstable_mockModule('../src/modules/purchase/supplierPayment.repository.js', () => ({ supplierPaymentRepository: mockSupplierPaymentRepo }));
jest.unstable_mockModule('../src/modules/purchase/supplierLedger.service.js', () => ({ supplierLedgerService: mockSupplierLedgerService }));
jest.unstable_mockModule('../src/modules/purchase/purchase.audit.js', () => ({ purchaseAudit: mockPurchaseAudit }));
// Mocked to avoid loading account.model.js for real - it calls
// `new mongoose.Schema(...)` at module-load time, and mongoose is mocked below.
jest.unstable_mockModule('../src/modules/accounting/accountingEvents.service.js', () => ({ accountingEvents: mockAccountingEvents }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { supplierPaymentService } = await import('../src/modules/purchase/supplierPayment.service.js');

beforeEach(() => {
  [mockPurchaseOrderRepo, mockSupplierPaymentRepo, mockSupplierLedgerService, mockPurchaseAudit, mockAccountingEvents, mockSession].forEach((mockObj) =>
    Object.values(mockObj).forEach((fn) => fn.mockReset?.())
  );
});

describe('supplierPaymentService.recordPayment', () => {
  it('posts a negative ledger delta and recomputes the PO payment status as partial when under grandTotal', async () => {
    mockSupplierPaymentRepo.create.mockResolvedValue({ _id: 'pay1', amount: 400 });
    const po = { _id: 'po1', grandTotal: 1000, save: jest.fn() };
    mockPurchaseOrderRepo.findRawById.mockResolvedValue(po);
    mockSupplierPaymentRepo.sumPaidByPurchaseOrder.mockResolvedValue(400);

    await supplierPaymentService.recordPayment('s1', { purchaseOrder: 'po1', method: 'cash', amount: 400 }, 'u1');

    expect(mockSupplierLedgerService.recordEntry).toHaveBeenCalledWith(
      expect.objectContaining({ supplierId: 's1', type: 'payment', amount: -400 }),
      mockSession
    );
    expect(po.paymentStatus).toBe('partial');
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('recomputes the PO payment status as paid once fully covered', async () => {
    mockSupplierPaymentRepo.create.mockResolvedValue({ _id: 'pay1', amount: 1000 });
    const po = { _id: 'po1', grandTotal: 1000, save: jest.fn() };
    mockPurchaseOrderRepo.findRawById.mockResolvedValue(po);
    mockSupplierPaymentRepo.sumPaidByPurchaseOrder.mockResolvedValue(1000);

    await supplierPaymentService.recordPayment('s1', { purchaseOrder: 'po1', method: 'bank', amount: 1000 }, 'u1');

    expect(po.paymentStatus).toBe('paid');
  });

  it('skips PO payment status recomputation for a general (non-PO) payment', async () => {
    mockSupplierPaymentRepo.create.mockResolvedValue({ _id: 'pay1', amount: 200 });

    await supplierPaymentService.recordPayment('s1', { method: 'upi', amount: 200 }, 'u1');

    expect(mockPurchaseOrderRepo.findRawById).not.toHaveBeenCalled();
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });
});

describe('supplierPaymentService.refundPayment', () => {
  it('reverses the ledger effect with a positive delta and marks the payment refunded', async () => {
    const payment = { _id: 'pay1', supplier: 's1', purchaseOrder: null, amount: 500, status: 'paid', save: jest.fn() };
    mockSupplierPaymentRepo.findById.mockResolvedValue(payment);

    await supplierPaymentService.refundPayment('pay1', 'u1');

    expect(payment.status).toBe('refunded');
    expect(mockSupplierLedgerService.recordEntry).toHaveBeenCalledWith(
      expect.objectContaining({ supplierId: 's1', type: 'payment', amount: 500 }),
      mockSession
    );
  });

  it('rejects refunding an already-refunded payment', async () => {
    mockSupplierPaymentRepo.findById.mockResolvedValue({ _id: 'pay1', status: 'refunded' });

    await expect(supplierPaymentService.refundPayment('pay1', 'u1')).rejects.toThrow('already been refunded');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});
