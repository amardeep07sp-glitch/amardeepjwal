import { jest } from '@jest/globals';

const mockInventoryRepo = {
  findRawById: jest.fn(),
  applyMovementDelta: jest.fn(),
};
const mockMovementRepo = {
  create: jest.fn(),
};
const mockAlertService = {
  raiseAlert: jest.fn(),
  evaluateForInventory: jest.fn(),
};
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};

jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({
  inventoryRepository: mockInventoryRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventoryMovement.repository.js', () => ({
  inventoryMovementRepository: mockMovementRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventoryAlert.service.js', () => ({
  inventoryAlertService: mockAlertService,
}));
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { inventoryLedgerService } = await import('../src/modules/inventory/inventoryLedger.service.js');

const baseInventory = {
  _id: 'inv1',
  product: 'p1',
  variant: null,
  warehouse: 'w1',
  availableQuantity: 10,
  reservedQuantity: 0,
  damagedQuantity: 0,
  returnedQuantity: 0,
  incomingQuantity: 0,
  minimumStock: 2,
  stockStatus: 'in_stock',
};

beforeEach(() => {
  Object.values(mockInventoryRepo).forEach((fn) => fn.mockReset());
  Object.values(mockMovementRepo).forEach((fn) => fn.mockReset());
  Object.values(mockAlertService).forEach((fn) => fn.mockReset());
  Object.values(mockSession).forEach((fn) => fn.mockReset());
});

describe('inventoryLedgerService.recordMovement', () => {
  it('applies a positive delta, writes a ledger row, and commits', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ ...baseInventory });
    mockMovementRepo.create.mockResolvedValue({ _id: 'mv1' });

    await inventoryLedgerService.recordMovement({
      inventoryId: 'inv1',
      movementType: 'purchase',
      quantityChanged: 5,
      performedBy: 'u1',
    });

    expect(mockInventoryRepo.applyMovementDelta).toHaveBeenCalledWith(
      'inv1',
      { availableQuantity: 5 },
      'in_stock',
      mockSession
    );
    expect(mockMovementRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ quantityBefore: 10, quantityChanged: 5, quantityAfter: 15, movementType: 'purchase' }),
      mockSession
    );
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(mockSession.abortTransaction).not.toHaveBeenCalled();
  });

  it('rejects a movement that would make a field negative, raises an alert, and aborts', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ ...baseInventory, availableQuantity: 2 });

    await expect(
      inventoryLedgerService.recordMovement({ inventoryId: 'inv1', movementType: 'sale', quantityChanged: -5 })
    ).rejects.toThrow('Insufficient stock');

    expect(mockAlertService.raiseAlert).toHaveBeenCalledWith('inv1', 'negative_stock_attempt', expect.any(String));
    expect(mockInventoryRepo.applyMovementDelta).not.toHaveBeenCalled();
    expect(mockMovementRepo.create).not.toHaveBeenCalled();
    expect(mockSession.abortTransaction).toHaveBeenCalled();
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
  });

  it('recomputes stock status to out_of_stock when available hits zero', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ ...baseInventory, availableQuantity: 5 });
    mockMovementRepo.create.mockResolvedValue({ _id: 'mv1' });

    await inventoryLedgerService.recordMovement({ inventoryId: 'inv1', movementType: 'sale', quantityChanged: -5 });

    expect(mockInventoryRepo.applyMovementDelta).toHaveBeenCalledWith(
      'inv1',
      { availableQuantity: -5 },
      'out_of_stock',
      mockSession
    );
  });

  it('never flips a DISCONTINUED item back to an automatic status after a movement', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ ...baseInventory, availableQuantity: 20, stockStatus: 'discontinued' });
    mockMovementRepo.create.mockResolvedValue({ _id: 'mv1' });

    await inventoryLedgerService.recordMovement({ inventoryId: 'inv1', movementType: 'purchase', quantityChanged: 1 });

    expect(mockInventoryRepo.applyMovementDelta).toHaveBeenCalledWith(
      'inv1',
      { availableQuantity: 1 },
      'discontinued',
      mockSession
    );
  });

  it('applies extra field deltas atomically alongside the primary field (e.g. damage)', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ ...baseInventory, availableQuantity: 10, damagedQuantity: 0 });
    mockMovementRepo.create.mockResolvedValue({ _id: 'mv1' });

    await inventoryLedgerService.recordMovement({
      inventoryId: 'inv1',
      movementType: 'damage',
      quantityChanged: 1,
      extraFieldDeltas: { availableQuantity: -1 },
    });

    expect(mockInventoryRepo.applyMovementDelta).toHaveBeenCalledWith(
      'inv1',
      { damagedQuantity: 1, availableQuantity: -1 },
      'in_stock',
      mockSession
    );
  });

  it('reuses an externally-provided session and never starts/commits its own', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ ...baseInventory });
    mockMovementRepo.create.mockResolvedValue({ _id: 'mv1' });
    const externalSession = { id: 'external-session' };

    await inventoryLedgerService.recordMovement(
      { inventoryId: 'inv1', movementType: 'purchase', quantityChanged: 1 },
      externalSession
    );

    expect(mockSession.startTransaction).not.toHaveBeenCalled();
    expect(mockSession.commitTransaction).not.toHaveBeenCalled();
    expect(mockInventoryRepo.applyMovementDelta).toHaveBeenCalledWith(
      'inv1',
      { availableQuantity: 1 },
      'in_stock',
      externalSession
    );
  });

  it('honors primaryFieldOverride (reservation-to-sale conversion touches reservedQuantity, not availableQuantity)', async () => {
    mockInventoryRepo.findRawById.mockResolvedValue({ ...baseInventory, reservedQuantity: 3, availableQuantity: 10 });
    mockMovementRepo.create.mockResolvedValue({ _id: 'mv1' });

    await inventoryLedgerService.recordMovement({
      inventoryId: 'inv1',
      movementType: 'sale',
      primaryFieldOverride: 'reservedQuantity',
      quantityChanged: -3,
    });

    expect(mockInventoryRepo.applyMovementDelta).toHaveBeenCalledWith(
      'inv1',
      { reservedQuantity: -3 },
      'in_stock',
      mockSession
    );
  });

  it('throws for an unknown movement type without touching the repository', async () => {
    await expect(
      inventoryLedgerService.recordMovement({ inventoryId: 'inv1', movementType: 'not_a_real_type', quantityChanged: 1 })
    ).rejects.toThrow('Unknown movement type');
    expect(mockInventoryRepo.findRawById).not.toHaveBeenCalled();
  });
});
