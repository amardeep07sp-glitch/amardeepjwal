import { jest } from '@jest/globals';

const mockProductRepo = {
  findRawById: jest.fn(),
};

const mockPriceHistoryRepo = {
  create: jest.fn(),
  findPaginatedByProduct: jest.fn(),
};

jest.unstable_mockModule('../src/modules/product/product.repository.js', () => ({
  productRepository: mockProductRepo,
}));

jest.unstable_mockModule('../src/modules/product/pricing/priceHistory.repository.js', () => ({
  priceHistoryRepository: mockPriceHistoryRepo,
}));

const { pricingService } = await import('../src/modules/product/pricing/pricing.service.js');

const buildProductDoc = (pricing) => ({
  _id: 'prod1',
  pricing,
  save: jest.fn().mockResolvedValue(undefined),
});

beforeEach(() => {
  Object.values(mockProductRepo).forEach((fn) => fn.mockReset());
  Object.values(mockPriceHistoryRepo).forEach((fn) => fn.mockReset());
});

describe('pricingService.getPricing', () => {
  it('throws 404 when the product does not exist', async () => {
    mockProductRepo.findRawById.mockResolvedValue(null);

    await expect(pricingService.getPricing('missing')).rejects.toThrow('Product not found');
  });

  it('returns the current pricing with a computed preview', async () => {
    mockProductRepo.findRawById.mockResolvedValue(
      buildProductDoc({
        mrp: 1000,
        discountType: 'percentage',
        discountValue: 10,
        taxIncluded: false,
        taxPercentage: 0,
        finalPrice: 900,
      })
    );

    const result = await pricingService.getPricing('prod1');

    expect(result.preview.finalPrice).toBe(900);
    expect(result.preview.discountAmount).toBe(100);
  });
});

describe('pricingService.updatePricing', () => {
  it('recalculates finalPrice, saves it, and always records history', async () => {
    const productDoc = buildProductDoc({ finalPrice: 500 });
    mockProductRepo.findRawById.mockResolvedValue(productDoc);

    const result = await pricingService.updatePricing(
      'prod1',
      {
        mrp: 1000,
        discountType: 'fixed',
        discountValue: 100,
        taxIncluded: false,
        taxPercentage: 0,
        reason: 'Seasonal repricing',
      },
      'user1'
    );

    expect(productDoc.save).toHaveBeenCalledTimes(1);
    expect(productDoc.pricing.finalPrice).toBe(900);
    expect(result.finalPrice).toBe(900);

    expect(mockPriceHistoryRepo.create).toHaveBeenCalledWith({
      product: 'prod1',
      oldPrice: 500,
      newPrice: 900,
      updatedBy: 'user1',
      reason: 'Seasonal repricing',
    });
  });

  it('records history even when the final price does not change', async () => {
    const productDoc = buildProductDoc({ finalPrice: 900 });
    mockProductRepo.findRawById.mockResolvedValue(productDoc);

    await pricingService.updatePricing(
      'prod1',
      { mrp: 1000, discountType: 'fixed', discountValue: 100, taxIncluded: false, taxPercentage: 0 },
      'user1'
    );

    expect(mockPriceHistoryRepo.create).toHaveBeenCalledTimes(1);
    expect(mockPriceHistoryRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ oldPrice: 900, newPrice: 900 })
    );
  });

  it('throws 404 when the product does not exist', async () => {
    mockProductRepo.findRawById.mockResolvedValue(null);

    await expect(pricingService.updatePricing('missing', {}, 'user1')).rejects.toThrow('Product not found');
    expect(mockPriceHistoryRepo.create).not.toHaveBeenCalled();
  });
});

describe('pricingService.getPriceHistory', () => {
  it('returns a paginated, serialized history list', async () => {
    mockPriceHistoryRepo.findPaginatedByProduct.mockResolvedValue({
      items: [
        {
          _id: 'h1',
          product: 'prod1',
          oldPrice: 500,
          newPrice: 900,
          updatedBy: { _id: 'u1', name: 'Dev Admin', email: 'dev@local.test' },
          reason: 'Seasonal repricing',
          createdAt: new Date('2026-01-01'),
        },
      ],
      total: 1,
    });

    const result = await pricingService.getPriceHistory('prod1', { page: 1, limit: 10 });

    expect(result.meta.totalItems).toBe(1);
    expect(result.items[0].updatedBy.name).toBe('Dev Admin');
    expect(result.items[0].newPrice).toBe(900);
  });
});
