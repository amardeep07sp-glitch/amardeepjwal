import { jest } from '@jest/globals';

const mockProductRepo = {
  findRawById: jest.fn(),
};

const mockAttributeRepo = {
  findById: jest.fn(),
};

const mockAttributeValueRepo = {
  findById: jest.fn(),
};

const mockVariantRepo = {
  findPaginatedByProduct: jest.fn(),
  findAllByProduct: jest.fn(),
  findFirstByProduct: jest.fn(),
  findById: jest.fn(),
  findRawById: jest.fn(),
  countByProduct: jest.fn(),
  findExistingCombinationKeys: jest.fn(),
  findByCombinationKey: jest.fn(),
  findDefaultByProduct: jest.fn(),
  create: jest.fn(),
  insertMany: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  deleteByIds: jest.fn(),
  updateManyStatus: jest.fn(),
  unsetDefaultForProduct: jest.fn(),
  setDefault: jest.fn(),
};

jest.unstable_mockModule('../src/modules/product/product.repository.js', () => ({
  productRepository: mockProductRepo,
}));
jest.unstable_mockModule('../src/modules/attribute/attribute.repository.js', () => ({
  attributeRepository: mockAttributeRepo,
}));
jest.unstable_mockModule('../src/modules/attributeValue/attributeValue.repository.js', () => ({
  attributeValueRepository: mockAttributeValueRepo,
}));
jest.unstable_mockModule('../src/modules/product/variant/variant.repository.js', () => ({
  variantRepository: mockVariantRepo,
}));

const mockInventoryService = {
  provisionForVariants: jest.fn(),
};
jest.unstable_mockModule('../src/modules/inventory/inventory.service.js', () => ({
  inventoryService: mockInventoryService,
}));

const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { variantService } = await import('../src/modules/product/variant/variant.service.js');

beforeEach(() => {
  [mockProductRepo, mockAttributeRepo, mockAttributeValueRepo, mockVariantRepo].forEach((repo) => {
    Object.values(repo).forEach((fn) => fn.mockReset());
  });
  Object.values(mockInventoryService).forEach((fn) => fn.mockReset());
  Object.values(mockSession).forEach((fn) => fn.mockReset());
});

const SIZE_ATTR = 'attr-size';
const PURITY_ATTR = 'attr-purity';
const SIZE_18 = 'val-size-18';
const PURITY_22K = 'val-purity-22k';

describe('variantService.createVariant', () => {
  it('forces the first variant of a product to be the default, regardless of input', async () => {
    mockProductRepo.findRawById.mockResolvedValue({ _id: 'p1', sku: 'RING-001' });
    mockVariantRepo.countByProduct.mockResolvedValue(0);
    mockVariantRepo.create.mockResolvedValue({ _id: 'v1' });
    mockVariantRepo.findById.mockResolvedValue({ _id: 'v1', isDefault: true, attributes: [] });

    const result = await variantService.createVariant('p1', { sku: 'RING-001-A', isDefault: false, attributes: [] });

    expect(mockVariantRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ isDefault: true }),
      mockSession
    );
    expect(result.isDefault).toBe(true);
  });

  it('unsets other defaults when a later variant is explicitly made default', async () => {
    mockProductRepo.findRawById.mockResolvedValue({ _id: 'p1', sku: 'RING-001' });
    mockVariantRepo.countByProduct.mockResolvedValue(1);
    mockVariantRepo.create.mockResolvedValue({ _id: 'v2' });
    mockVariantRepo.findById.mockResolvedValue({ _id: 'v2', isDefault: true, attributes: [] });

    await variantService.createVariant('p1', { sku: 'RING-001-B', isDefault: true, attributes: [] });

    expect(mockVariantRepo.unsetDefaultForProduct).toHaveBeenCalledWith('p1', 'v2');
  });

  it('rejects a combination that already exists for the product', async () => {
    mockProductRepo.findRawById.mockResolvedValue({ _id: 'p1', sku: 'RING-001' });
    mockAttributeValueRepo.findById.mockImplementation((id) =>
      Promise.resolve({ _id: id, attribute: { toString: () => SIZE_ATTR }, value: '18' })
    );
    mockVariantRepo.findByCombinationKey.mockResolvedValue({ _id: 'existing-variant' });

    await expect(
      variantService.createVariant('p1', {
        sku: 'RING-001-C',
        attributes: [{ attribute: SIZE_ATTR, value: SIZE_18 }],
      })
    ).rejects.toThrow('A variant with this exact attribute combination already exists');
  });

  it('rejects a value that does not belong to the given attribute', async () => {
    mockProductRepo.findRawById.mockResolvedValue({ _id: 'p1', sku: 'RING-001' });
    mockAttributeValueRepo.findById.mockResolvedValue({
      _id: SIZE_18,
      value: '18',
      attribute: { toString: () => PURITY_ATTR },
    });

    await expect(
      variantService.createVariant('p1', {
        sku: 'RING-001-D',
        attributes: [{ attribute: SIZE_ATTR, value: SIZE_18 }],
      })
    ).rejects.toThrow('does not belong to the given attribute');
  });
});

describe('variantService.updateVariant', () => {
  it('unsets other defaults when this variant becomes the default', async () => {
    mockVariantRepo.findRawById.mockResolvedValue({ _id: 'v1', product: { toString: () => 'p1' } });
    mockVariantRepo.updateById.mockResolvedValue({ _id: 'v1', isDefault: true });

    await variantService.updateVariant('p1', 'v1', { isDefault: true });

    expect(mockVariantRepo.unsetDefaultForProduct).toHaveBeenCalledWith('p1', 'v1');
  });

  it('promotes another variant to default if this one is explicitly un-defaulted', async () => {
    mockVariantRepo.findRawById.mockResolvedValue({ _id: 'v1', product: { toString: () => 'p1' } });
    mockVariantRepo.updateById.mockResolvedValue({ _id: 'v1', isDefault: false });
    mockVariantRepo.findDefaultByProduct.mockResolvedValue(null);
    mockVariantRepo.findFirstByProduct.mockResolvedValue({ _id: 'v2' });

    await variantService.updateVariant('p1', 'v1', { isDefault: false });

    expect(mockVariantRepo.setDefault).toHaveBeenCalledWith('v2');
  });

  it('throws 404 when the variant does not belong to the given product', async () => {
    mockVariantRepo.findRawById.mockResolvedValue({ _id: 'v1', product: { toString: () => 'other-product' } });

    await expect(variantService.updateVariant('p1', 'v1', { sku: 'X' })).rejects.toThrow('Variant not found');
  });
});

describe('variantService.deleteVariant', () => {
  it('promotes a new default after deleting the current default variant', async () => {
    mockVariantRepo.findRawById.mockResolvedValue({ _id: 'v1', product: { toString: () => 'p1' } });
    mockVariantRepo.findDefaultByProduct.mockResolvedValue(null);
    mockVariantRepo.findFirstByProduct.mockResolvedValue({ _id: 'v2' });

    await variantService.deleteVariant('p1', 'v1');

    expect(mockVariantRepo.deleteById).toHaveBeenCalledWith('v1');
    expect(mockVariantRepo.setDefault).toHaveBeenCalledWith('v2');
  });

  it('does nothing extra when a default variant already remains', async () => {
    mockVariantRepo.findRawById.mockResolvedValue({ _id: 'v1', product: { toString: () => 'p1' } });
    mockVariantRepo.findDefaultByProduct.mockResolvedValue({ _id: 'v3' });

    await variantService.deleteVariant('p1', 'v1');

    expect(mockVariantRepo.setDefault).not.toHaveBeenCalled();
  });
});

describe('variantService.bulkDuplicate', () => {
  it('clones non-identity fields into a new draft variant with no attributes and a fresh SKU', async () => {
    mockVariantRepo.findRawById.mockResolvedValue({
      _id: 'v1',
      sku: 'RING-001-18-22K',
      isVisible: true,
      order: 2,
      priceOverride: 500,
      weightOverride: 3.2,
    });
    mockVariantRepo.insertMany.mockResolvedValue([{ _id: 'copy1' }]);

    await variantService.bulkDuplicate('p1', ['v1']);

    const [insertedDocs] = mockVariantRepo.insertMany.mock.calls[0];
    expect(insertedDocs).toHaveLength(1);
    expect(insertedDocs[0]).toEqual(
      expect.objectContaining({
        product: 'p1',
        status: 'draft',
        isDefault: false,
        isFeatured: false,
        attributes: [],
        priceOverride: 500,
        weightOverride: 3.2,
      })
    );
    expect(insertedDocs[0].sku).not.toBe('RING-001-18-22K');
    expect(insertedDocs[0].sku.startsWith('RING-001-18-22K-COPY-')).toBe(true);
  });
});

describe('variantService.generateVariants', () => {
  it('creates the full cartesian product and marks the first as default when starting from zero', async () => {
    mockProductRepo.findRawById.mockResolvedValue({ _id: 'p1', sku: 'RING-001' });
    mockAttributeRepo.findById.mockResolvedValue({ _id: SIZE_ATTR, name: 'Size' });
    mockVariantRepo.findExistingCombinationKeys.mockResolvedValue(new Set());
    mockAttributeValueRepo.findById.mockResolvedValue({ _id: SIZE_18, value: '18' });
    mockVariantRepo.countByProduct.mockResolvedValue(0);
    mockVariantRepo.insertMany.mockResolvedValue([{ _id: 'v1' }, { _id: 'v2' }]);

    const result = await variantService.generateVariants('p1', {
      attributes: [{ attributeId: SIZE_ATTR, valueIds: [SIZE_18, 'val-size-20'] }],
    });

    const [insertedDocs] = mockVariantRepo.insertMany.mock.calls[0];
    expect(insertedDocs).toHaveLength(2);
    expect(insertedDocs[0].isDefault).toBe(true);
    expect(insertedDocs[1].isDefault).toBe(false);
    expect(insertedDocs.every((doc) => doc.status === 'draft')).toBe(true);
    expect(result.skippedCount).toBe(0);
  });

  it('skips combinations that already exist and reports the skipped count', async () => {
    mockProductRepo.findRawById.mockResolvedValue({ _id: 'p1', sku: 'RING-001' });
    mockAttributeRepo.findById.mockResolvedValue({ _id: SIZE_ATTR, name: 'Size' });
    const existingKey = `${SIZE_ATTR}:${SIZE_18}`;
    mockVariantRepo.findExistingCombinationKeys.mockResolvedValue(new Set([existingKey]));

    const result = await variantService.generateVariants('p1', {
      attributes: [{ attributeId: SIZE_ATTR, valueIds: [SIZE_18] }],
    });

    expect(mockVariantRepo.insertMany).not.toHaveBeenCalled();
    expect(result.created).toEqual([]);
    expect(result.skippedCount).toBe(1);
  });

  it('throws when a referenced attribute does not exist', async () => {
    mockProductRepo.findRawById.mockResolvedValue({ _id: 'p1', sku: 'RING-001' });
    mockAttributeRepo.findById.mockResolvedValue(null);

    await expect(
      variantService.generateVariants('p1', { attributes: [{ attributeId: 'missing', valueIds: ['x'] }] })
    ).rejects.toThrow('does not exist');
  });
});
