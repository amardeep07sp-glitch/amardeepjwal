import { jest } from '@jest/globals';

const mockBarcodeRepo = {
  findActiveForEntity: jest.fn(),
  countByType: jest.fn(),
  findByValue: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  findById: jest.fn(),
  deleteById: jest.fn(),
};
const mockInventoryRepo = {
  countByBarcode: jest.fn(),
};

jest.unstable_mockModule('../src/modules/inventory/barcode.repository.js', () => ({
  barcodeRepository: mockBarcodeRepo,
}));
jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({
  inventoryRepository: mockInventoryRepo,
}));

const { barcodeService } = await import('../src/modules/inventory/barcode.service.js');

beforeEach(() => {
  Object.values(mockBarcodeRepo).forEach((fn) => fn.mockReset());
  Object.values(mockInventoryRepo).forEach((fn) => fn.mockReset());
});

describe('barcodeService.generateBarcode', () => {
  it('rejects generating a second active barcode for the same product', async () => {
    mockBarcodeRepo.findActiveForEntity.mockResolvedValue({ _id: 'b1', status: 'active' });

    await expect(
      barcodeService.generateBarcode({ productId: 'p1', variantId: null, barcodeType: 'ean13' })
    ).rejects.toThrow('active barcode already exists');
    expect(mockBarcodeRepo.create).not.toHaveBeenCalled();
  });

  it('generates a fresh barcode when none is active yet', async () => {
    mockBarcodeRepo.findActiveForEntity.mockResolvedValue(null);
    mockBarcodeRepo.countByType.mockResolvedValue(0);
    mockBarcodeRepo.findByValue.mockResolvedValue(null);
    mockBarcodeRepo.create.mockResolvedValue({ _id: 'b1' });

    await barcodeService.generateBarcode({ productId: 'p1', variantId: null, barcodeType: 'code128' });

    expect(mockBarcodeRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ barcodeType: 'code128', product: 'p1', variant: null })
    );
  });

  it('rejects an invalid manually-provided value', async () => {
    mockBarcodeRepo.findActiveForEntity.mockResolvedValue(null);

    await expect(
      barcodeService.generateBarcode({ productId: 'p1', variantId: null, barcodeType: 'ean13', manualValue: 'not-valid' })
    ).rejects.toThrow('not a valid EAN13 value');
    expect(mockBarcodeRepo.create).not.toHaveBeenCalled();
  });
});

describe('barcodeService.regenerateBarcode', () => {
  it('deactivates the old barcode and creates a new active one', async () => {
    mockBarcodeRepo.findActiveForEntity.mockResolvedValue({ _id: 'old1', status: 'active' });
    mockBarcodeRepo.countByType.mockResolvedValue(1);
    mockBarcodeRepo.findByValue.mockResolvedValue(null);
    mockBarcodeRepo.create.mockResolvedValue({ _id: 'new1' });

    await barcodeService.regenerateBarcode({ productId: 'p1', variantId: null, barcodeType: 'code128' });

    expect(mockBarcodeRepo.updateById).toHaveBeenCalledWith('old1', { status: 'inactive' });
    expect(mockBarcodeRepo.create).toHaveBeenCalled();
  });
});

describe('barcodeService.deleteBarcode', () => {
  it('rejects deletion when an inventory record still references the barcode', async () => {
    mockBarcodeRepo.findById.mockResolvedValue({ _id: 'b1' });
    mockInventoryRepo.countByBarcode.mockResolvedValue(1);

    await expect(barcodeService.deleteBarcode('b1')).rejects.toThrow('still referenced');
    expect(mockBarcodeRepo.deleteById).not.toHaveBeenCalled();
  });

  it('deletes a barcode with no inventory references', async () => {
    mockBarcodeRepo.findById.mockResolvedValue({ _id: 'b1' });
    mockInventoryRepo.countByBarcode.mockResolvedValue(0);

    await barcodeService.deleteBarcode('b1');

    expect(mockBarcodeRepo.deleteById).toHaveBeenCalledWith('b1');
  });
});
