import { jest } from '@jest/globals';

const mockSupplierRepo = { findRawById: jest.fn(), applyLedgerDelta: jest.fn() };
const mockSupplierLedgerRepo = { create: jest.fn(), findPaginatedBySupplier: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/supplier/supplier.repository.js', () => ({ supplierRepository: mockSupplierRepo }));
jest.unstable_mockModule('../src/modules/purchase/supplierLedger.repository.js', () => ({ supplierLedgerRepository: mockSupplierLedgerRepo }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { supplierLedgerService } = await import('../src/modules/purchase/supplierLedger.service.js');

beforeEach(() => {
  [mockSupplierRepo, mockSupplierLedgerRepo, mockSession].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));
});

describe('supplierLedgerService.recordEntry', () => {
  it('applies a positive delta (purchase) and writes a ledger row reflecting the new balance', async () => {
    mockSupplierRepo.findRawById.mockResolvedValue({ _id: 's1', outstandingBalance: 1000 });
    mockSupplierLedgerRepo.create.mockResolvedValue({ _id: 'l1', balanceAfter: 1500 });

    const entry = await supplierLedgerService.recordEntry({
      supplierId: 's1',
      type: 'purchase',
      amount: 500,
      reason: 'Goods received',
    });

    expect(mockSupplierRepo.applyLedgerDelta).toHaveBeenCalledWith('s1', 500, mockSession);
    expect(mockSupplierLedgerRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ supplier: 's1', type: 'purchase', amount: 500, balanceAfter: 1500 }),
      mockSession
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(entry.balanceAfter).toBe(1500);
  });

  it('applies a negative delta (payment) reducing the balance', async () => {
    mockSupplierRepo.findRawById.mockResolvedValue({ _id: 's1', outstandingBalance: 1000 });
    mockSupplierLedgerRepo.create.mockResolvedValue({ _id: 'l2', balanceAfter: 700 });

    await supplierLedgerService.recordEntry({ supplierId: 's1', type: 'payment', amount: -300, reason: 'Paid supplier' });

    expect(mockSupplierRepo.applyLedgerDelta).toHaveBeenCalledWith('s1', -300, mockSession);
  });

  // Deliberately different from Wallet/Inventory - a payable balance going
  // negative (a credit) is valid real-world accounting, not an error, so
  // there is no guard here and this must never throw.
  it('allows the balance to go negative without rejecting (unlike Wallet/Inventory)', async () => {
    mockSupplierRepo.findRawById.mockResolvedValue({ _id: 's1', outstandingBalance: 100 });
    mockSupplierLedgerRepo.create.mockResolvedValue({ _id: 'l3', balanceAfter: -400 });

    const entry = await supplierLedgerService.recordEntry({ supplierId: 's1', type: 'payment', amount: -500, reason: 'Overpaid' });

    expect(entry.balanceAfter).toBe(-400);
    expect(mockSession.abortTransaction).not.toHaveBeenCalled();
  });

  it('reuses the caller-provided session instead of opening its own transaction', async () => {
    mockSupplierRepo.findRawById.mockResolvedValue({ _id: 's1', outstandingBalance: 100 });
    mockSupplierLedgerRepo.create.mockResolvedValue({ _id: 'l4', balanceAfter: 50 });
    const externalSession = { fake: true };

    await supplierLedgerService.recordEntry({ supplierId: 's1', type: 'return', amount: -50 }, externalSession);

    expect(mockSupplierRepo.applyLedgerDelta).toHaveBeenCalledWith('s1', -50, externalSession);
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
  });

  it('throws if the supplier does not exist', async () => {
    mockSupplierRepo.findRawById.mockResolvedValue(null);

    await expect(supplierLedgerService.recordEntry({ supplierId: 'missing', type: 'purchase', amount: 100 })).rejects.toThrow(
      'Supplier not found'
    );
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});
