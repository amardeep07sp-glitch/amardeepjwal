import { jest } from '@jest/globals';

const mockPurchaseOrderRepo = { findRawById: jest.fn() };
const mockPurchaseItemRepo = { findById: jest.fn(), applyReturn: jest.fn() };
const mockPurchaseReturnRepo = { create: jest.fn(), findById: jest.fn(), updateById: jest.fn(), findPaginated: jest.fn(), findByPurchaseOrder: jest.fn() };
const mockPurchaseNumbering = { getNextReturnNumber: jest.fn() };
const mockPurchaseAudit = { record: jest.fn() };
const mockSupplierLedgerService = { recordEntry: jest.fn() };
const mockInventoryService = { findOrCreateForScope: jest.fn(), recordPurchaseReturn: jest.fn() };
const mockInventoryLedgerService = { evaluateAlertsAfterCommit: jest.fn() };
const mockAccountingEvents = { recordPurchaseReturn: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/purchase/purchaseOrder.repository.js', () => ({ purchaseOrderRepository: mockPurchaseOrderRepo }));
jest.unstable_mockModule('../src/modules/purchase/purchaseItem.repository.js', () => ({ purchaseItemRepository: mockPurchaseItemRepo }));
jest.unstable_mockModule('../src/modules/purchase/purchaseReturn.repository.js', () => ({ purchaseReturnRepository: mockPurchaseReturnRepo }));
jest.unstable_mockModule('../src/modules/purchase/purchase.numbering.js', () => ({ purchaseNumbering: mockPurchaseNumbering }));
jest.unstable_mockModule('../src/modules/purchase/purchase.audit.js', () => ({ purchaseAudit: mockPurchaseAudit }));
jest.unstable_mockModule('../src/modules/purchase/supplierLedger.service.js', () => ({ supplierLedgerService: mockSupplierLedgerService }));
jest.unstable_mockModule('../src/modules/inventory/inventory.service.js', () => ({ inventoryService: mockInventoryService }));
jest.unstable_mockModule('../src/modules/inventory/inventoryLedger.service.js', () => ({ inventoryLedgerService: mockInventoryLedgerService }));
// Mocked to avoid loading pricing.schema.js for real (same class of bug as
// purchaseOrder.service.test.js).
jest.unstable_mockModule('../src/modules/product/pricing/priceCalculator.js', () => ({ round2: (n) => Math.round(n * 100) / 100 }));
// Mocked to avoid loading account.model.js for real - it calls
// `new mongoose.Schema(...)` at module-load time, and mongoose is mocked below.
jest.unstable_mockModule('../src/modules/accounting/accountingEvents.service.js', () => ({ accountingEvents: mockAccountingEvents }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { purchaseReturnService } = await import('../src/modules/purchase/purchaseReturn.service.js');

beforeEach(() => {
  [
    mockPurchaseOrderRepo,
    mockPurchaseItemRepo,
    mockPurchaseReturnRepo,
    mockPurchaseNumbering,
    mockPurchaseAudit,
    mockSupplierLedgerService,
    mockInventoryService,
    mockInventoryLedgerService,
    mockAccountingEvents,
    mockSession,
  ].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));

  mockPurchaseNumbering.getNextReturnNumber.mockResolvedValue('PRET-000001');
  mockInventoryService.findOrCreateForScope.mockResolvedValue({ _id: 'inv1' });
});

describe('purchaseReturnService.requestReturn', () => {
  it('rejects returning more than has been received (minus what was already returned)', async () => {
    mockPurchaseOrderRepo.findRawById.mockResolvedValue({ _id: 'po1', status: 'received', supplier: 's1' });
    mockPurchaseItemRepo.findById.mockResolvedValue({ _id: 'i1', purchaseOrder: 'po1', sku: 'SKU1', receivedQuantity: 5, returnedQuantity: 3, unitCost: 100 });

    await expect(
      purchaseReturnService.requestReturn('po1', { items: [{ purchaseItem: 'i1', quantity: 3 }], action: 'refund' }, 'u1')
    ).rejects.toThrow('only 2 available to return');
  });

  it('computes the return value from quantity * unitCost and creates the record', async () => {
    mockPurchaseOrderRepo.findRawById.mockResolvedValue({ _id: 'po1', status: 'received', supplier: 's1' });
    mockPurchaseItemRepo.findById.mockResolvedValue({ _id: 'i1', purchaseOrder: 'po1', sku: 'SKU1', receivedQuantity: 5, returnedQuantity: 0, unitCost: 200 });
    mockPurchaseReturnRepo.create.mockResolvedValue({ _id: 'ret1', returnNumber: 'PRET-000001', amount: 400 });

    await purchaseReturnService.requestReturn('po1', { items: [{ purchaseItem: 'i1', quantity: 2 }], reason: 'Damaged', action: 'refund' }, 'u1');

    expect(mockPurchaseReturnRepo.create).toHaveBeenCalledWith(expect.objectContaining({ amount: 400, action: 'refund', supplier: 's1' }));
  });

  it('rejects returning against a PO that has never received anything', async () => {
    mockPurchaseOrderRepo.findRawById.mockResolvedValue({ _id: 'po1', status: 'approved', supplier: 's1' });

    await expect(
      purchaseReturnService.requestReturn('po1', { items: [{ purchaseItem: 'i1', quantity: 1 }], action: 'refund' }, 'u1')
    ).rejects.toThrow('Cannot return goods');
  });
});

describe('purchaseReturnService transition guards', () => {
  it('rejects approving a return that is not requested', async () => {
    mockPurchaseReturnRepo.findById.mockResolvedValue({ _id: 'r1', status: 'approved' });

    await expect(purchaseReturnService.approveReturn('r1', 'u1')).rejects.toThrow('Cannot move a purchase return');
  });
});

describe('purchaseReturnService.completeReturn', () => {
  it('debits availableQuantity via inventoryService.recordPurchaseReturn and posts a negative ledger entry', async () => {
    const purchaseReturn = {
      _id: 'r1',
      purchaseOrder: 'po1',
      supplier: 's1',
      status: 'approved',
      returnNumber: 'PRET-000001',
      amount: 400,
      items: [{ purchaseItem: 'i1', quantity: 2 }],
      save: jest.fn(),
    };
    mockPurchaseReturnRepo.findById.mockResolvedValue(purchaseReturn);
    mockPurchaseOrderRepo.findRawById.mockResolvedValue({ _id: 'po1', warehouse: 'w1' });
    mockPurchaseItemRepo.findById.mockResolvedValue({ _id: 'i1', product: 'p1', variant: null, sku: 'SKU1' });

    await purchaseReturnService.completeReturn('r1', 'u1');

    expect(mockInventoryService.recordPurchaseReturn).toHaveBeenCalledWith(
      'inv1',
      2,
      expect.objectContaining({ referenceType: 'purchase_return', referenceId: 'r1', session: mockSession })
    );
    expect(mockPurchaseItemRepo.applyReturn).toHaveBeenCalledWith('i1', 2, mockSession);
    expect(mockSupplierLedgerService.recordEntry).toHaveBeenCalledWith(
      expect.objectContaining({ supplierId: 's1', type: 'return', amount: -400 }),
      mockSession
    );
    expect(purchaseReturn.status).toBe('completed');
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('rejects completing a return that has not been approved', async () => {
    mockPurchaseReturnRepo.findById.mockResolvedValue({ _id: 'r1', status: 'requested' });

    await expect(purchaseReturnService.completeReturn('r1', 'u1')).rejects.toThrow('Cannot complete');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});
