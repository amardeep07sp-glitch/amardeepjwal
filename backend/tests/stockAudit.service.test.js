import { jest } from '@jest/globals';

const mockAuditRepo = {
  create: jest.fn(),
  findRawById: jest.fn(),
  updateById: jest.fn(),
};
const mockInventoryRepo = {
  findRawById: jest.fn(),
};
const mockLedgerService = {
  recordMovement: jest.fn(),
};

jest.unstable_mockModule('../src/modules/inventory/stockAudit.repository.js', () => ({
  stockAuditRepository: mockAuditRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({
  inventoryRepository: mockInventoryRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventoryLedger.service.js', () => ({
  inventoryLedgerService: mockLedgerService,
}));

const { stockAuditService } = await import('../src/modules/inventory/stockAudit.service.js');

beforeEach(() => {
  Object.values(mockAuditRepo).forEach((fn) => fn.mockReset());
  Object.values(mockInventoryRepo).forEach((fn) => fn.mockReset());
  Object.values(mockLedgerService).forEach((fn) => fn.mockReset());
});

describe('stockAuditService.createAudit', () => {
  it('snapshots the current system quantity and computes the difference', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ _id: 'inv1', availableQuantity: 20 });
    mockAuditRepo.create.mockResolvedValue({ _id: 'audit1' });

    await stockAuditService.createAudit({ inventory: 'inv1', countedQuantity: 18 }, 'u1');

    expect(mockAuditRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ systemQuantity: 20, countedQuantity: 18, difference: -2 })
    );
  });
});

describe('stockAuditService.completeAudit', () => {
  it('records a MANUAL_ADJUSTMENT-equivalent movement for a non-zero difference and marks completed', async () => {
    mockAuditRepo.findRawById.mockResolvedValue({
      _id: 'audit1',
      inventory: 'inv1',
      countedQuantity: 18,
      systemQuantity: 20,
      difference: -2,
      status: 'draft',
    });
    mockAuditRepo.updateById.mockResolvedValue({ _id: 'audit1', status: 'completed' });

    await stockAuditService.completeAudit('audit1', 'u1');

    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({ inventoryId: 'inv1', movementType: 'stock_audit', quantityChanged: -2 })
    );
    expect(mockAuditRepo.updateById).toHaveBeenCalledWith('audit1', { status: 'completed' });
  });

  it('still writes a ledger entry even when the difference is zero', async () => {
    mockAuditRepo.findRawById.mockResolvedValue({
      _id: 'audit1',
      inventory: 'inv1',
      countedQuantity: 20,
      systemQuantity: 20,
      difference: 0,
      status: 'draft',
    });
    mockAuditRepo.updateById.mockResolvedValue({ _id: 'audit1', status: 'completed' });

    await stockAuditService.completeAudit('audit1', 'u1');

    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({ quantityChanged: 0 })
    );
  });

  it('rejects completing an already-completed audit', async () => {
    mockAuditRepo.findRawById.mockResolvedValue({ _id: 'audit1', status: 'completed' });

    await expect(stockAuditService.completeAudit('audit1', 'u1')).rejects.toThrow('already completed');
    expect(mockLedgerService.recordMovement).not.toHaveBeenCalled();
  });
});
