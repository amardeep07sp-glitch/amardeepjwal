import { jest } from '@jest/globals';

const mockInventoryRepo = {
  findPaginated: jest.fn(),
  findById: jest.fn(),
  findAllByProduct: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  getDashboardTotals: jest.fn(),
};
const mockMovementRepo = {
  findPaginatedByInventory: jest.fn(),
  findRecent: jest.fn(),
};
const mockLedgerService = {
  recordMovement: jest.fn(),
};
const mockWarehouseRepo = {
  findDefault: jest.fn(),
};

jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({
  inventoryRepository: mockInventoryRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventoryMovement.repository.js', () => ({
  inventoryMovementRepository: mockMovementRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventoryLedger.service.js', () => ({
  inventoryLedgerService: mockLedgerService,
}));
jest.unstable_mockModule('../src/modules/inventory/warehouse.repository.js', () => ({
  warehouseRepository: mockWarehouseRepo,
}));

const { inventoryService } = await import('../src/modules/inventory/inventory.service.js');

beforeEach(() => {
  Object.values(mockInventoryRepo).forEach((fn) => fn.mockReset());
  Object.values(mockMovementRepo).forEach((fn) => fn.mockReset());
  Object.values(mockLedgerService).forEach((fn) => fn.mockReset());
  Object.values(mockWarehouseRepo).forEach((fn) => fn.mockReset());
});

describe('inventoryService.provisionForProduct', () => {
  it('creates a zero-stock inventory record in the default warehouse', async () => {
    mockWarehouseRepo.findDefault.mockResolvedValue({ _id: 'w1' });
    mockInventoryRepo.create.mockResolvedValue({ _id: 'inv1' });

    await inventoryService.provisionForProduct({ _id: 'p1', sku: 'SKU-1', createdBy: 'u1' });

    expect(mockInventoryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ product: 'p1', variant: null, warehouse: 'w1', sku: 'SKU-1' }),
      undefined
    );
  });

  it('throws if no default warehouse is configured', async () => {
    mockWarehouseRepo.findDefault.mockResolvedValue(null);

    await expect(inventoryService.provisionForProduct({ _id: 'p1', sku: 'SKU-1' })).rejects.toThrow(
      'No default warehouse'
    );
  });
});

describe('inventoryService.provisionForVariants', () => {
  it('creates one inventory record per variant', async () => {
    mockWarehouseRepo.findDefault.mockResolvedValue({ _id: 'w1' });
    mockInventoryRepo.create.mockResolvedValueOnce({ _id: 'inv1' }).mockResolvedValueOnce({ _id: 'inv2' });

    const result = await inventoryService.provisionForVariants(
      [
        { _id: 'v1', sku: 'SKU-1-RED' },
        { _id: 'v2', sku: 'SKU-1-BLUE' },
      ],
      'p1'
    );

    expect(mockInventoryRepo.create).toHaveBeenCalledTimes(2);
    expect(result).toHaveLength(2);
  });

  it('does nothing for an empty variant list', async () => {
    const result = await inventoryService.provisionForVariants([], 'p1');
    expect(result).toEqual([]);
    expect(mockWarehouseRepo.findDefault).not.toHaveBeenCalled();
  });
});

describe('inventoryService reservation methods', () => {
  it('reserveStock moves quantity from available to reserved via the ledger', async () => {
    await inventoryService.reserveStock('inv1', 3, { referenceId: 'order1' });

    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        inventoryId: 'inv1',
        movementType: 'reservation',
        quantityChanged: 3,
        extraFieldDeltas: { availableQuantity: -3 },
      }),
      undefined
    );
  });

  it('releaseReservation moves quantity back from reserved to available', async () => {
    await inventoryService.releaseReservation('inv1', 3, { referenceId: 'order1' });

    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        inventoryId: 'inv1',
        movementType: 'reservation_release',
        quantityChanged: -3,
        extraFieldDeltas: { availableQuantity: 3 },
      }),
      undefined
    );
  });

  it('convertReservationToSale only touches reservedQuantity, never availableQuantity again', async () => {
    await inventoryService.convertReservationToSale('inv1', 3, { referenceId: 'order1' });

    expect(mockLedgerService.recordMovement).toHaveBeenCalledWith(
      expect.objectContaining({
        inventoryId: 'inv1',
        movementType: 'sale',
        primaryFieldOverride: 'reservedQuantity',
        quantityChanged: -3,
      }),
      undefined
    );
  });
});
