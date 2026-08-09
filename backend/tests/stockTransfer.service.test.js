import { jest } from '@jest/globals';

const mockTransferRepo = {
  findRawById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
};
const mockInventoryRepo = {
  findRawById: jest.fn(),
  findOneByScope: jest.fn(),
  create: jest.fn(),
};
const mockLedgerService = {
  recordMovement: jest.fn(),
  evaluateAlertsAfterCommit: jest.fn(),
};
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/inventory/stockTransfer.repository.js', () => ({
  stockTransferRepository: mockTransferRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({
  inventoryRepository: mockInventoryRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventoryLedger.service.js', () => ({
  inventoryLedgerService: mockLedgerService,
}));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { stockTransferService } = await import('../src/modules/inventory/stockTransfer.service.js');

beforeEach(() => {
  Object.values(mockTransferRepo).forEach((fn) => fn.mockReset());
  Object.values(mockInventoryRepo).forEach((fn) => fn.mockReset());
  Object.values(mockLedgerService).forEach((fn) => fn.mockReset());
  Object.values(mockSession).forEach((fn) => fn.mockReset());
});

describe('stockTransferService.requestTransfer', () => {
  it('rejects a request where fromWarehouse does not match the inventory record', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ _id: 'inv1', warehouse: 'w1', availableQuantity: 10 });

    await expect(
      stockTransferService.requestTransfer(
        { inventory: 'inv1', fromWarehouse: 'w2', toWarehouse: 'w3', quantity: 5 },
        'u1'
      )
    ).rejects.toThrow("fromWarehouse must match");
  });

  it('rejects a request with insufficient available stock', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ _id: 'inv1', warehouse: 'w1', availableQuantity: 2 });

    await expect(
      stockTransferService.requestTransfer(
        { inventory: 'inv1', fromWarehouse: 'w1', toWarehouse: 'w2', quantity: 5 },
        'u1'
      )
    ).rejects.toThrow('Insufficient available stock');
  });

  it('creates a requested transfer when everything checks out', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ _id: 'inv1', warehouse: 'w1', availableQuantity: 10 });
    mockTransferRepo.create.mockResolvedValue({ _id: 't1', status: 'requested' });

    await stockTransferService.requestTransfer(
      { inventory: 'inv1', fromWarehouse: 'w1', toWarehouse: 'w2', quantity: 5 },
      'u1'
    );

    expect(mockTransferRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ inventory: 'inv1', requestedBy: 'u1' })
    );
  });
});

describe('stockTransferService.completeTransfer', () => {
  it('rejects completing a transfer that is not yet approved', async () => {
    mockTransferRepo.findRawById.mockResolvedValue({ _id: 't1', status: 'requested' });

    await expect(stockTransferService.completeTransfer('t1', 'u1')).rejects.toThrow('must be approved');
    expect(mockLedgerService.recordMovement).not.toHaveBeenCalled();
  });

  it('writes both TRANSFER_OUT and TRANSFER_IN movements and marks the transfer completed', async () => {
    mockTransferRepo.findRawById.mockResolvedValue({
      _id: 't1',
      status: 'approved',
      inventory: 'inv1',
      toWarehouse: 'w2',
      quantity: 5,
    });
    mockInventoryRepo.findRawById.mockResolvedValue({ _id: 'inv1', product: 'p1', variant: null, sku: 'SKU-1' });
    mockInventoryRepo.findOneByScope.mockResolvedValue({ _id: 'inv2' });
    mockTransferRepo.updateById.mockResolvedValue({ _id: 't1', status: 'completed' });

    await stockTransferService.completeTransfer('t1', 'u1');

    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({ inventoryId: 'inv1', movementType: 'transfer_out', quantityChanged: -5 }),
      mockSession
    );
    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({ inventoryId: 'inv2', movementType: 'transfer_in', quantityChanged: 5 }),
      mockSession
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockTransferRepo.updateById).toHaveBeenCalledWith('t1', expect.objectContaining({ status: 'completed' }));
  });

  it('creates a destination inventory record if one does not already exist there', async () => {
    mockTransferRepo.findRawById.mockResolvedValue({
      _id: 't1',
      status: 'approved',
      inventory: 'inv1',
      toWarehouse: 'w2',
      quantity: 5,
    });
    mockInventoryRepo.findRawById.mockResolvedValue({ _id: 'inv1', product: 'p1', variant: null, sku: 'SKU-1' });
    mockInventoryRepo.findOneByScope.mockResolvedValue(null);
    mockInventoryRepo.create.mockResolvedValue({ _id: 'inv-new' });
    mockTransferRepo.updateById.mockResolvedValue({ _id: 't1', status: 'completed' });

    await stockTransferService.completeTransfer('t1', 'u1');

    expect(mockInventoryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'p1', warehouse: 'w2', sku: 'SKU-1' }),
      mockSession
    );
    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({ inventoryId: 'inv-new', movementType: 'transfer_in' }),
      mockSession
    );
  });

  it('aborts the transaction and does not mark completed if the second movement fails', async () => {
    mockTransferRepo.findRawById.mockResolvedValue({
      _id: 't1',
      status: 'approved',
      inventory: 'inv1',
      toWarehouse: 'w2',
      quantity: 5,
    });
    mockInventoryRepo.findRawById.mockResolvedValue({ _id: 'inv1', product: 'p1', variant: null, sku: 'SKU-1' });
    mockInventoryRepo.findOneByScope.mockResolvedValue({ _id: 'inv2' });
    mockLedgerService.recordMovement
      .mockResolvedValueOnce({ _id: 'mv1' })
      .mockRejectedValueOnce(new Error('Insufficient stock'));

    await expect(stockTransferService.completeTransfer('t1', 'u1')).rejects.toThrow('Insufficient stock');

    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    expect(mockTransferRepo.updateById).not.toHaveBeenCalled();
  });
});
