import { jest } from '@jest/globals';

const mockPurchaseOrderRepo = { findRawById: jest.fn(), save: jest.fn() };
const mockPurchaseItemRepo = { findById: jest.fn(), findByPurchaseOrder: jest.fn(), applyReceipt: jest.fn() };
const mockGrnRepo = { create: jest.fn(), findById: jest.fn(), findByPurchaseOrder: jest.fn() };
const mockPurchaseNumbering = { getNextGrnNumber: jest.fn() };
const mockPurchaseAudit = { record: jest.fn() };
const mockSupplierLedgerService = { recordEntry: jest.fn() };
const mockInventoryService = { findOrCreateForScope: jest.fn(), receivePurchase: jest.fn() };
const mockInventoryLedgerService = { evaluateAlertsAfterCommit: jest.fn() };
const mockAccountingEvents = { recordPurchaseReceipt: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/purchase/purchaseOrder.repository.js', () => ({ purchaseOrderRepository: mockPurchaseOrderRepo }));
jest.unstable_mockModule('../src/modules/purchase/purchaseItem.repository.js', () => ({ purchaseItemRepository: mockPurchaseItemRepo }));
jest.unstable_mockModule('../src/modules/purchase/goodsReceiptNote.repository.js', () => ({ goodsReceiptNoteRepository: mockGrnRepo }));
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

const { goodsReceiptNoteService } = await import('../src/modules/purchase/goodsReceiptNote.service.js');

beforeEach(() => {
  [
    mockPurchaseOrderRepo,
    mockPurchaseItemRepo,
    mockGrnRepo,
    mockPurchaseNumbering,
    mockPurchaseAudit,
    mockSupplierLedgerService,
    mockInventoryService,
    mockInventoryLedgerService,
    mockAccountingEvents,
    mockSession,
  ].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));

  mockPurchaseNumbering.getNextGrnNumber.mockResolvedValue('GRN-000001');
  mockInventoryService.findOrCreateForScope.mockResolvedValue({ _id: 'inv1' });
});

describe('goodsReceiptNoteService.receiveGoods', () => {
  it('full receive: marks the PO Received when every item is fully received', async () => {
    const po = { _id: 'po1', status: 'ordered', warehouse: 'w1', supplier: 's1', poNumber: 'PO-1', save: jest.fn() };
    mockPurchaseOrderRepo.findRawById.mockResolvedValue(po);
    const purchaseItem = { _id: 'i1', purchaseOrder: 'po1', product: 'p1', variant: null, sku: 'SKU1', unitCost: 100, pendingQuantity: 5 };
    mockPurchaseItemRepo.findById.mockResolvedValue(purchaseItem);
    mockGrnRepo.create.mockResolvedValue({ _id: 'grn1' });
    mockPurchaseItemRepo.findByPurchaseOrder.mockResolvedValue([{ _id: 'i1', pendingQuantity: 0 }]);
    mockGrnRepo.findById.mockResolvedValue({ _id: 'grn1', grnNumber: 'GRN-000001' });

    await goodsReceiptNoteService.receiveGoods('po1', { items: [{ purchaseItem: 'i1', receivedQuantity: 5 }] }, 'u1');

    expect(mockInventoryService.receivePurchase).toHaveBeenCalledWith(
      'inv1',
      5,
      expect.objectContaining({ referenceType: 'goods_receipt_note', referenceId: 'grn1', session: mockSession })
    );
    expect(mockPurchaseItemRepo.applyReceipt).toHaveBeenCalledWith('i1', 5, mockSession);
    expect(po.status).toBe('received');
    expect(mockSupplierLedgerService.recordEntry).toHaveBeenCalledWith(
      expect.objectContaining({ supplierId: 's1', type: 'purchase', amount: 500 }),
      mockSession
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('partial receive: leaves the PO Partially Received when some quantity remains pending', async () => {
    const po = { _id: 'po1', status: 'ordered', warehouse: 'w1', supplier: 's1', poNumber: 'PO-1', save: jest.fn() };
    mockPurchaseOrderRepo.findRawById.mockResolvedValue(po);
    mockPurchaseItemRepo.findById.mockResolvedValue({ _id: 'i1', purchaseOrder: 'po1', product: 'p1', variant: null, sku: 'SKU1', unitCost: 100, pendingQuantity: 10 });
    mockGrnRepo.create.mockResolvedValue({ _id: 'grn1' });
    mockPurchaseItemRepo.findByPurchaseOrder.mockResolvedValue([{ _id: 'i1', pendingQuantity: 6 }]);
    mockGrnRepo.findById.mockResolvedValue({ _id: 'grn1' });

    await goodsReceiptNoteService.receiveGoods('po1', { items: [{ purchaseItem: 'i1', receivedQuantity: 4 }] }, 'u1');

    expect(po.status).toBe('partially_received');
  });

  it('rejects receiving more than a line item has pending', async () => {
    mockPurchaseOrderRepo.findRawById.mockResolvedValue({ _id: 'po1', status: 'ordered', supplier: 's1' });
    mockPurchaseItemRepo.findById.mockResolvedValue({ _id: 'i1', purchaseOrder: 'po1', sku: 'SKU1', pendingQuantity: 2 });

    await expect(
      goodsReceiptNoteService.receiveGoods('po1', { items: [{ purchaseItem: 'i1', receivedQuantity: 5 }] }, 'u1')
    ).rejects.toThrow('only 2 pending');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockInventoryService.receivePurchase).not.toHaveBeenCalled();
  });

  it('rejects receiving against a PO that is not in a receivable status', async () => {
    mockPurchaseOrderRepo.findRawById.mockResolvedValue({ _id: 'po1', status: 'approved' });

    await expect(
      goodsReceiptNoteService.receiveGoods('po1', { items: [{ purchaseItem: 'i1', receivedQuantity: 1 }] }, 'u1')
    ).rejects.toThrow('Cannot receive goods');
  });
});
