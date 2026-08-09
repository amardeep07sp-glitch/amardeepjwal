import { jest } from '@jest/globals';

const mockWarehouseRepo = {
  findDefault: jest.fn(),
  findAll: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  unsetDefaultExcept: jest.fn(),
  updateManyStatus: jest.fn(),
};
const mockInventoryRepo = {
  countByWarehouse: jest.fn(),
};

jest.unstable_mockModule('../src/modules/inventory/warehouse.repository.js', () => ({
  warehouseRepository: mockWarehouseRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({
  inventoryRepository: mockInventoryRepo,
}));

const { warehouseService } = await import('../src/modules/inventory/warehouse.service.js');

beforeEach(() => {
  Object.values(mockWarehouseRepo).forEach((fn) => fn.mockReset());
  Object.values(mockInventoryRepo).forEach((fn) => fn.mockReset());
});

describe('warehouseService.ensureDefaultWarehouse', () => {
  it('does nothing if a default warehouse already exists', async () => {
    mockWarehouseRepo.findDefault.mockResolvedValue({ _id: 'w1', isDefault: true });

    await warehouseService.ensureDefaultWarehouse();

    expect(mockWarehouseRepo.create).not.toHaveBeenCalled();
  });

  it('promotes an existing warehouse to default if one exists but none is marked default', async () => {
    mockWarehouseRepo.findDefault.mockResolvedValue(null);
    mockWarehouseRepo.findAll.mockResolvedValue([{ _id: 'w1' }]);

    await warehouseService.ensureDefaultWarehouse();

    expect(mockWarehouseRepo.updateById).toHaveBeenCalledWith('w1', { isDefault: true });
    expect(mockWarehouseRepo.create).not.toHaveBeenCalled();
  });

  it('creates a brand new default warehouse if none exist at all', async () => {
    mockWarehouseRepo.findDefault.mockResolvedValue(null);
    mockWarehouseRepo.findAll.mockResolvedValue([]);

    await warehouseService.ensureDefaultWarehouse();

    expect(mockWarehouseRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ code: 'MAIN', isDefault: true })
    );
  });
});

describe('warehouseService.deleteWarehouse', () => {
  it('rejects deletion when inventory records still reference the warehouse', async () => {
    mockWarehouseRepo.findById.mockResolvedValue({ _id: 'w1', isDefault: false });
    mockInventoryRepo.countByWarehouse.mockResolvedValue(3);

    await expect(warehouseService.deleteWarehouse('w1')).rejects.toThrow('3 inventory record(s)');
    expect(mockWarehouseRepo.deleteById).not.toHaveBeenCalled();
  });

  it('rejects deletion of the default warehouse even with zero inventory', async () => {
    mockWarehouseRepo.findById.mockResolvedValue({ _id: 'w1', isDefault: true });
    mockInventoryRepo.countByWarehouse.mockResolvedValue(0);

    await expect(warehouseService.deleteWarehouse('w1')).rejects.toThrow('default warehouse');
    expect(mockWarehouseRepo.deleteById).not.toHaveBeenCalled();
  });

  it('deletes a non-default warehouse with zero inventory', async () => {
    mockWarehouseRepo.findById.mockResolvedValue({ _id: 'w1', isDefault: false });
    mockInventoryRepo.countByWarehouse.mockResolvedValue(0);

    await warehouseService.deleteWarehouse('w1');

    expect(mockWarehouseRepo.deleteById).toHaveBeenCalledWith('w1');
  });
});

describe('warehouseService.setDefault', () => {
  it('sets the given warehouse as default and unsets every other one', async () => {
    mockWarehouseRepo.updateById.mockResolvedValue({ _id: 'w2', isDefault: true });

    await warehouseService.setDefault('w2');

    expect(mockWarehouseRepo.unsetDefaultExcept).toHaveBeenCalledWith('w2');
  });
});
