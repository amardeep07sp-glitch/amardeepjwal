import { jest } from '@jest/globals';

const mockProductRepo = { findRawById: jest.fn() };
const mockVariantRepo = { findById: jest.fn() };
const mockMediaRepo = { findPaginatedByEntity: jest.fn() };
const mockWarehouseRepo = { findDefault: jest.fn() };
const mockInventoryService = { findOrCreateForScope: jest.fn(), commitPurchaseOrder: jest.fn(), releasePurchaseCommitment: jest.fn() };
const mockInventoryLedgerService = { evaluateAlertsAfterCommit: jest.fn() };
const mockBarcodeRepo = { findActiveForEntity: jest.fn() };
const mockSupplierRepo = { findRawById: jest.fn() };
const mockPurchaseOrderRepo = {
  findRawById: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
};
const mockPurchaseItemRepo = { findByPurchaseOrder: jest.fn(), insertMany: jest.fn() };
const mockPurchaseNumbering = { getNextPoNumber: jest.fn() };
const mockPurchaseAudit = { record: jest.fn() };
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/product/product.repository.js', () => ({ productRepository: mockProductRepo }));
jest.unstable_mockModule('../src/modules/product/variant/variant.repository.js', () => ({ variantRepository: mockVariantRepo }));
jest.unstable_mockModule('../src/modules/media/media.repository.js', () => ({ mediaRepository: mockMediaRepo }));
jest.unstable_mockModule('../src/modules/inventory/warehouse.repository.js', () => ({ warehouseRepository: mockWarehouseRepo }));
jest.unstable_mockModule('../src/modules/inventory/inventory.service.js', () => ({ inventoryService: mockInventoryService }));
jest.unstable_mockModule('../src/modules/inventory/inventoryLedger.service.js', () => ({ inventoryLedgerService: mockInventoryLedgerService }));
jest.unstable_mockModule('../src/modules/inventory/barcode.repository.js', () => ({ barcodeRepository: mockBarcodeRepo }));
jest.unstable_mockModule('../src/modules/supplier/supplier.repository.js', () => ({ supplierRepository: mockSupplierRepo }));
jest.unstable_mockModule('../src/modules/purchase/purchaseOrder.repository.js', () => ({ purchaseOrderRepository: mockPurchaseOrderRepo }));
jest.unstable_mockModule('../src/modules/purchase/purchaseItem.repository.js', () => ({ purchaseItemRepository: mockPurchaseItemRepo }));
jest.unstable_mockModule('../src/modules/purchase/purchase.numbering.js', () => ({ purchaseNumbering: mockPurchaseNumbering }));
jest.unstable_mockModule('../src/modules/purchase/purchase.audit.js', () => ({ purchaseAudit: mockPurchaseAudit }));
// Mocked to avoid loading pricing.schema.js for real - it calls
// `new mongoose.Schema(...)` at module-load time, and mongoose is mocked
// below (same class of bug documented throughout this test suite).
jest.unstable_mockModule('../src/modules/product/pricing/priceCalculator.js', () => ({ round2: (n) => Math.round(n * 100) / 100 }));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { purchaseOrderService } = await import('../src/modules/purchase/purchaseOrder.service.js');

beforeEach(() => {
  [
    mockProductRepo,
    mockVariantRepo,
    mockMediaRepo,
    mockWarehouseRepo,
    mockInventoryService,
    mockInventoryLedgerService,
    mockBarcodeRepo,
    mockSupplierRepo,
    mockPurchaseOrderRepo,
    mockPurchaseItemRepo,
    mockPurchaseNumbering,
    mockPurchaseAudit,
    mockSession,
  ].forEach((mockObj) => Object.values(mockObj).forEach((fn) => fn.mockReset?.()));

  mockMediaRepo.findPaginatedByEntity.mockResolvedValue({ items: [] });
  mockBarcodeRepo.findActiveForEntity.mockResolvedValue(null);
});

describe('purchaseOrderService.createPurchaseOrder', () => {
  it('creates the PO and its items, computing totals from unitCost/discount/tax/shippingCharge', async () => {
    mockSupplierRepo.findRawById.mockResolvedValue({ _id: 's1', name: 'Acme Gems' });
    mockPurchaseNumbering.getNextPoNumber.mockResolvedValue('PO-000001');
    const po = { _id: 'po1', shippingCharge: 50, save: jest.fn() };
    mockPurchaseOrderRepo.create.mockResolvedValue(po);
    mockProductRepo.findRawById.mockResolvedValue({ _id: 'p1', name: 'Gold Ring', sku: 'RING-1' });
    mockPurchaseOrderRepo.findById.mockResolvedValue({ _id: 'po1', poNumber: 'PO-000001' });

    await purchaseOrderService.createPurchaseOrder(
      { supplier: 's1', warehouse: 'w1', shippingCharge: 50, items: [{ product: 'p1', quantity: 2, unitCost: 1000, discount: 100, tax: 50 }] },
      'u1'
    );

    expect(mockPurchaseItemRepo.insertMany).toHaveBeenCalledWith(
      [expect.objectContaining({ purchaseOrder: 'po1', quantity: 2, unitCost: 1000, pendingQuantity: 2, receivedQuantity: 0 })],
      mockSession
    );
    // subtotal = 1000*2 = 2000, grandTotal = 2000 - 100 + 50 + 50(shipping) = 2000
    expect(po.subtotal).toBe(2000);
    expect(po.grandTotal).toBe(2000);
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('aborts if the supplier does not exist', async () => {
    mockSupplierRepo.findRawById.mockResolvedValue(null);

    await expect(
      purchaseOrderService.createPurchaseOrder({ supplier: 'missing', warehouse: 'w1', items: [] }, 'u1')
    ).rejects.toThrow('Supplier not found');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});

describe('purchaseOrderService.approvePurchaseOrder', () => {
  it('resolves an immutable supplierSnapshot the first time it is approved', async () => {
    const po = { _id: 'po1', status: 'pending', supplier: 's1', supplierSnapshot: null, poNumber: 'PO-1', save: jest.fn() };
    mockPurchaseOrderRepo.findRawById.mockResolvedValue(po);
    mockSupplierRepo.findRawById.mockResolvedValue({ name: 'Acme Gems', email: 'a@x.com', phone: '999', gstNumber: 'GST1' });
    mockPurchaseOrderRepo.findById.mockResolvedValue({ _id: 'po1', status: 'approved' });

    await purchaseOrderService.approvePurchaseOrder('po1', 'u1');

    expect(po.supplierSnapshot).toEqual({ name: 'Acme Gems', email: 'a@x.com', phone: '999', gstNumber: 'GST1' });
    expect(po.status).toBe('approved');
    expect(mockPurchaseAudit.record).toHaveBeenCalledWith(expect.objectContaining({ event: 'po_approved' }));
  });

  it('never re-resolves the snapshot once already set (idempotent)', async () => {
    const existingSnapshot = { name: 'Frozen', email: '', phone: '', gstNumber: '' };
    const po = { _id: 'po1', status: 'pending', supplier: 's1', supplierSnapshot: existingSnapshot, poNumber: 'PO-1', save: jest.fn() };
    mockPurchaseOrderRepo.findRawById.mockResolvedValue(po);
    mockPurchaseOrderRepo.findById.mockResolvedValue({ _id: 'po1' });

    await purchaseOrderService.approvePurchaseOrder('po1', 'u1');

    expect(mockSupplierRepo.findRawById).not.toHaveBeenCalled();
    expect(po.supplierSnapshot).toBe(existingSnapshot);
  });

  it('rejects approving a PO that is not pending', async () => {
    mockPurchaseOrderRepo.findRawById.mockResolvedValue({ _id: 'po1', status: 'draft' });

    await expect(purchaseOrderService.approvePurchaseOrder('po1', 'u1')).rejects.toThrow('Cannot approve');
  });
});

describe('purchaseOrderService.markOrdered', () => {
  it('commits every line item quantity as Inventory.incomingQuantity', async () => {
    const po = { _id: 'po1', status: 'approved', warehouse: 'w1', supplier: 's1', poNumber: 'PO-1', save: jest.fn() };
    mockPurchaseOrderRepo.findRawById.mockResolvedValue(po);
    mockPurchaseItemRepo.findByPurchaseOrder.mockResolvedValue([
      { _id: 'i1', product: 'p1', variant: null, sku: 'SKU1', pendingQuantity: 5 },
    ]);
    mockInventoryService.findOrCreateForScope.mockResolvedValue({ _id: 'inv1' });
    mockPurchaseOrderRepo.findById.mockResolvedValue({ _id: 'po1', status: 'ordered' });

    await purchaseOrderService.markOrdered('po1', 'u1');

    expect(mockInventoryService.commitPurchaseOrder).toHaveBeenCalledWith(
      'inv1',
      5,
      expect.objectContaining({ referenceType: 'purchase_order', referenceId: 'po1', session: mockSession })
    );
    expect(po.status).toBe('ordered');
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockInventoryLedgerService.evaluateAlertsAfterCommit).toHaveBeenCalledWith('inv1');
  });

  it('rejects marking ordered a PO that is not approved', async () => {
    mockPurchaseOrderRepo.findRawById.mockResolvedValue({ _id: 'po1', status: 'draft' });

    await expect(purchaseOrderService.markOrdered('po1', 'u1')).rejects.toThrow('Cannot mark');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});

describe('purchaseOrderService.cancelPurchaseOrder', () => {
  it('releases the remaining incoming commitment when cancelling an ordered PO', async () => {
    const po = { _id: 'po1', status: 'ordered', warehouse: 'w1', supplier: 's1', poNumber: 'PO-1', save: jest.fn() };
    mockPurchaseOrderRepo.findRawById.mockResolvedValue(po);
    mockPurchaseItemRepo.findByPurchaseOrder.mockResolvedValue([
      { _id: 'i1', product: 'p1', variant: null, sku: 'SKU1', pendingQuantity: 3 },
    ]);
    mockInventoryService.findOrCreateForScope.mockResolvedValue({ _id: 'inv1' });
    mockPurchaseOrderRepo.findById.mockResolvedValue({ _id: 'po1', status: 'cancelled' });

    await purchaseOrderService.cancelPurchaseOrder('po1', { userId: 'u1' });

    expect(mockInventoryService.releasePurchaseCommitment).toHaveBeenCalledWith(
      'inv1',
      3,
      expect.objectContaining({ referenceType: 'purchase_order', session: mockSession })
    );
    expect(po.status).toBe('cancelled');
  });

  it('does not touch inventory when cancelling a draft PO (nothing was ever committed)', async () => {
    const po = { _id: 'po1', status: 'draft', supplier: 's1', poNumber: 'PO-1', save: jest.fn() };
    mockPurchaseOrderRepo.findRawById.mockResolvedValue(po);
    mockPurchaseOrderRepo.findById.mockResolvedValue({ _id: 'po1', status: 'cancelled' });

    await purchaseOrderService.cancelPurchaseOrder('po1', { userId: 'u1' });

    expect(mockInventoryService.releasePurchaseCommitment).not.toHaveBeenCalled();
    expect(mockPurchaseItemRepo.findByPurchaseOrder).not.toHaveBeenCalled();
  });

  it('rejects cancelling a fully received PO', async () => {
    mockPurchaseOrderRepo.findRawById.mockResolvedValue({ _id: 'po1', status: 'received' });

    await expect(purchaseOrderService.cancelPurchaseOrder('po1', { userId: 'u1' })).rejects.toThrow('Cannot cancel');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});
