import { jest } from '@jest/globals';

const mockAdjustmentRepo = {
  create: jest.fn(),
  findById: jest.fn(),
  updateById: jest.fn(),
};
const mockLedgerService = {
  recordMovement: jest.fn(),
};

jest.unstable_mockModule('../src/modules/inventory/stockAdjustment.repository.js', () => ({
  stockAdjustmentRepository: mockAdjustmentRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventoryLedger.service.js', () => ({
  inventoryLedgerService: mockLedgerService,
}));

const { stockAdjustmentService } = await import('../src/modules/inventory/stockAdjustment.service.js');

beforeEach(() => {
  Object.values(mockAdjustmentRepo).forEach((fn) => fn.mockReset());
  Object.values(mockLedgerService).forEach((fn) => fn.mockReset());
});

describe('stockAdjustmentService.createAdjustment', () => {
  it('auto-approves and immediately applies the movement for a privileged user', async () => {
    mockAdjustmentRepo.create.mockResolvedValue({
      _id: 'a1',
      inventory: 'inv1',
      type: 'increase',
      quantity: 5,
      reason: 'Opening stock',
    });

    await stockAdjustmentService.createAdjustment(
      { inventory: 'inv1', type: 'increase', quantity: 5, reason: 'Opening stock' },
      { _id: 'u1', role: 'admin' }
    );

    expect(mockAdjustmentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'approved' }));
    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({ inventoryId: 'inv1', movementType: 'manual_adjustment', quantityChanged: 5 })
    );
  });

  it('creates a pending request without applying any movement for a non-privileged user', async () => {
    mockAdjustmentRepo.create.mockResolvedValue({
      _id: 'a1',
      inventory: 'inv1',
      type: 'decrease',
      quantity: 2,
      reason: 'Found broken piece',
    });

    await stockAdjustmentService.createAdjustment(
      { inventory: 'inv1', type: 'decrease', quantity: 2, reason: 'Found broken piece' },
      { _id: 'u2', role: 'staff' }
    );

    expect(mockAdjustmentRepo.create).toHaveBeenCalledWith(expect.objectContaining({ status: 'pending' }));
    expect(mockLedgerService.recordMovement).not.toHaveBeenCalled();
  });

  it('applies a decrease as a negative quantityChanged', async () => {
    mockAdjustmentRepo.create.mockResolvedValue({
      _id: 'a1',
      inventory: 'inv1',
      type: 'decrease',
      quantity: 3,
      reason: 'Damaged in transit',
    });

    await stockAdjustmentService.createAdjustment(
      { inventory: 'inv1', type: 'decrease', quantity: 3, reason: 'Damaged in transit' },
      { _id: 'u1', role: 'super_admin' }
    );

    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({ quantityChanged: -3 })
    );
  });
});

describe('stockAdjustmentService.approveAdjustment', () => {
  it('applies the movement and marks the adjustment approved', async () => {
    mockAdjustmentRepo.findById.mockResolvedValue({
      _id: 'a1',
      inventory: 'inv1',
      type: 'increase',
      quantity: 4,
      reason: 'Restock',
      status: 'pending',
    });
    mockAdjustmentRepo.updateById.mockResolvedValue({ _id: 'a1', status: 'approved' });

    await stockAdjustmentService.approveAdjustment('a1', 'approver1');

    expect(mockLedgerService.recordMovement).toHaveBeenCalled();
    expect(mockAdjustmentRepo.updateById).toHaveBeenCalledWith('a1', { status: 'approved', approvedBy: 'approver1' });
  });

  it('rejects approving an adjustment that is not pending', async () => {
    mockAdjustmentRepo.findById.mockResolvedValue({ _id: 'a1', status: 'approved' });

    await expect(stockAdjustmentService.approveAdjustment('a1', 'approver1')).rejects.toThrow('already approved');
    expect(mockLedgerService.recordMovement).not.toHaveBeenCalled();
  });
});

describe('stockAdjustmentService.rejectAdjustment', () => {
  it('marks a pending adjustment as rejected without touching the ledger', async () => {
    mockAdjustmentRepo.findById.mockResolvedValue({ _id: 'a1', status: 'pending' });
    mockAdjustmentRepo.updateById.mockResolvedValue({ _id: 'a1', status: 'rejected' });

    await stockAdjustmentService.rejectAdjustment('a1', 'approver1');

    expect(mockLedgerService.recordMovement).not.toHaveBeenCalled();
    expect(mockAdjustmentRepo.updateById).toHaveBeenCalledWith('a1', { status: 'rejected', approvedBy: 'approver1' });
  });
});
