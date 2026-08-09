import { jest } from '@jest/globals';

const mockCollectionRepo = {
  findPaginated: jest.fn(),
  findById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  deleteByIds: jest.fn(),
  updateManyStatus: jest.fn(),
  findPublicPaginated: jest.fn(),
  findPublicBySlug: jest.fn(),
  incrementViewCount: jest.fn(),
  incrementClickCount: jest.fn(),
  findDueForAutoPublish: jest.fn(),
  findDueForAutoArchive: jest.fn(),
  getStatusCounts: jest.fn(),
  getTypeCounts: jest.fn(),
  countScheduled: jest.fn(),
};
jest.unstable_mockModule('../src/modules/collection/collection.repository.js', () => ({
  collectionRepository: mockCollectionRepo,
}));

const mockProductRepo = {
  buildManualCollectionFilter: jest.fn(),
  findAllPublicIds: jest.fn(),
  findPublicByFilter: jest.fn(),
  findPublicIdsByFilter: jest.fn(),
  findPublicByIds: jest.fn(),
  reorderCollectionProducts: jest.fn(),
};
jest.unstable_mockModule('../src/modules/product/product.repository.js', () => ({
  productRepository: mockProductRepo,
}));

const mockProductService = { buildPublicProductList: jest.fn() };
jest.unstable_mockModule('../src/modules/product/product.service.js', () => ({
  productService: mockProductService,
}));

const mockInventoryRepo = { getAvailableQuantityByProductIds: jest.fn() };
jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({
  inventoryRepository: mockInventoryRepo,
}));

const mockOrderItemRepo = { getBestSellingProductIds: jest.fn() };
jest.unstable_mockModule('../src/modules/order/orderItem.repository.js', () => ({
  orderItemRepository: mockOrderItemRepo,
}));

const mockProductAnalyticsService = { getViewCountsForProductIds: jest.fn() };
jest.unstable_mockModule('../src/modules/cip/productAnalytics.service.js', () => ({
  productAnalyticsService: mockProductAnalyticsService,
}));

const { collectionService } = await import('../src/modules/collection/collection.service.js');

beforeEach(() => {
  Object.values(mockCollectionRepo).forEach((fn) => fn.mockReset());
  Object.values(mockProductRepo).forEach((fn) => fn.mockReset());
  Object.values(mockProductService).forEach((fn) => fn.mockReset());
  Object.values(mockInventoryRepo).forEach((fn) => fn.mockReset());
  Object.values(mockOrderItemRepo).forEach((fn) => fn.mockReset());
  Object.values(mockProductAnalyticsService).forEach((fn) => fn.mockReset());
});

describe('collectionService.getCollectionById / updateCollection / deleteCollection (regression - existing fields untouched)', () => {
  it('throws 404 when the collection does not exist', async () => {
    mockCollectionRepo.findById.mockResolvedValue(null);
    await expect(collectionService.getCollectionById('missing')).rejects.toThrow('Collection not found');
  });

  it('returns the serialized collection when it exists', async () => {
    mockCollectionRepo.findById.mockResolvedValue({ _id: 'c1', name: 'Diwali Edit', slug: 'diwali-edit', seo: {} });
    const result = await collectionService.getCollectionById('c1');
    expect(result.name).toBe('Diwali Edit');
  });

  it('throws 404 updating a missing collection', async () => {
    mockCollectionRepo.updateById.mockResolvedValue(null);
    await expect(collectionService.updateCollection('missing', { name: 'X' })).rejects.toThrow('Collection not found');
  });

  it('throws 404 deleting a missing collection', async () => {
    mockCollectionRepo.deleteById.mockResolvedValue(null);
    await expect(collectionService.deleteCollection('missing')).rejects.toThrow('Collection not found');
  });
});

describe('collectionService.duplicateCollection', () => {
  it('throws 404 when the source collection does not exist', async () => {
    mockCollectionRepo.findById.mockResolvedValue(null);
    await expect(collectionService.duplicateCollection('missing')).rejects.toThrow('Collection not found');
  });

  it('increments the copy suffix instead of stacking "(Copy) (Copy)"', async () => {
    mockCollectionRepo.findById.mockResolvedValue({ _id: 'c1', name: 'Diwali Edit (Copy)', seo: {} });
    mockCollectionRepo.create.mockResolvedValue({ _id: 'c2', name: 'Diwali Edit (Copy 2)', seo: {} });

    await collectionService.duplicateCollection('c1');

    expect(mockCollectionRepo.create).toHaveBeenCalledWith(expect.objectContaining({ name: 'Diwali Edit (Copy 2)' }));
  });

  it('resets status to draft and never carries over analytics counters', async () => {
    mockCollectionRepo.findById.mockResolvedValue({ _id: 'c1', name: 'Diwali Edit', status: 'published', viewCount: 500, clickCount: 40, seo: {} });
    mockCollectionRepo.create.mockResolvedValue({ _id: 'c2', name: 'Diwali Edit (Copy)', seo: {} });

    await collectionService.duplicateCollection('c1');

    const payload = mockCollectionRepo.create.mock.calls[0][0];
    expect(payload.status).toBe('draft');
    expect(payload).not.toHaveProperty('viewCount');
    expect(payload).not.toHaveProperty('clickCount');
  });
});

describe('collectionService.resolveCollectionProducts', () => {
  const baseCollection = { id: 'c1', _id: 'c1' };

  it('resolves a manual collection via the collectionId filter and a direct-sortable mode', async () => {
    const collection = { ...baseCollection, assignmentType: 'manual', sortMode: 'newest' };
    mockProductRepo.buildManualCollectionFilter.mockReturnValue({ collectionId: 'c1' });
    mockProductRepo.findPublicByFilter.mockResolvedValue({ items: [{ _id: 'p1' }], total: 1 });
    mockProductService.buildPublicProductList.mockResolvedValue([{ id: 'p1' }]);

    const result = await collectionService.resolveCollectionProducts(collection, { page: 1, limit: 12 });

    expect(mockProductRepo.buildManualCollectionFilter).toHaveBeenCalledWith('c1');
    expect(mockProductRepo.findPublicByFilter).toHaveBeenCalledWith({ collectionId: 'c1' }, { sortMode: 'newest', page: 1, limit: 12 });
    expect(result.items).toEqual([{ id: 'p1' }]);
    expect(result.meta.totalItems).toBe(1);
  });

  it('resolves a rule-based collection via buildRuleFilter for a direct-sortable mode', async () => {
    const collection = {
      ...baseCollection,
      assignmentType: 'rule_based',
      sortMode: 'price_asc',
      rules: { matchMode: 'all', conditions: [{ field: 'featured', operator: 'equals', value: true }] },
    };
    mockProductRepo.findPublicByFilter.mockResolvedValue({ items: [], total: 0 });
    mockProductService.buildPublicProductList.mockResolvedValue([]);

    await collectionService.resolveCollectionProducts(collection, { page: 1, limit: 12 });

    expect(mockProductRepo.buildManualCollectionFilter).not.toHaveBeenCalled();
    expect(mockProductRepo.findPublicByFilter).toHaveBeenCalledWith({ isFeatured: true }, { sortMode: 'price_asc', page: 1, limit: 12 });
  });

  it('ranks candidates via the best-selling aggregation before paging, for the best_selling sort mode', async () => {
    const collection = { ...baseCollection, assignmentType: 'manual', sortMode: 'best_selling' };
    mockProductRepo.buildManualCollectionFilter.mockReturnValue({ collectionId: 'c1' });
    mockProductRepo.findPublicIdsByFilter.mockResolvedValue(['p1', 'p2', 'p3']);
    mockOrderItemRepo.getBestSellingProductIds.mockResolvedValue([{ _id: 'p3', unitsSold: 10 }, { _id: 'p1', unitsSold: 2 }]);
    mockProductRepo.findPublicByIds.mockResolvedValue([{ _id: 'p1' }, { _id: 'p3' }]);
    mockProductService.buildPublicProductList.mockResolvedValue([{ id: 'p3' }, { id: 'p1' }, { id: 'p2' }]);

    const result = await collectionService.resolveCollectionProducts(collection, { page: 1, limit: 12 });

    expect(mockOrderItemRepo.getBestSellingProductIds).toHaveBeenCalledWith(['p1', 'p2', 'p3'], 3);
    // p3 (10 sold) ranked first, p1 (2 sold) second, p2 (never sold) last -
    // never silently dropped from its own collection.
    expect(mockProductRepo.findPublicByIds).toHaveBeenCalledWith(['p3', 'p1', 'p2']);
    expect(result.meta.totalItems).toBe(3);
  });

  it('ranks candidates via real product_view events for the most_viewed sort mode', async () => {
    const collection = { ...baseCollection, assignmentType: 'manual', sortMode: 'most_viewed' };
    mockProductRepo.buildManualCollectionFilter.mockReturnValue({ collectionId: 'c1' });
    mockProductRepo.findPublicIdsByFilter.mockResolvedValue(['p1', 'p2']);
    mockProductAnalyticsService.getViewCountsForProductIds.mockResolvedValue([{ _id: 'p2', views: 50 }]);
    mockProductRepo.findPublicByIds.mockResolvedValue([{ _id: 'p1' }, { _id: 'p2' }]);
    mockProductService.buildPublicProductList.mockResolvedValue([]);

    await collectionService.resolveCollectionProducts(collection, { page: 1, limit: 12 });

    expect(mockProductAnalyticsService.getViewCountsForProductIds).toHaveBeenCalledWith(['p1', 'p2']);
    expect(mockProductRepo.findPublicByIds).toHaveBeenCalledWith(['p2', 'p1']);
  });

  it('resolves the stock rule condition into an injected id set before building the filter', async () => {
    const collection = {
      ...baseCollection,
      assignmentType: 'rule_based',
      sortMode: 'newest',
      rules: { matchMode: 'all', conditions: [{ field: 'stock', operator: 'equals', value: 'in_stock' }] },
    };
    mockProductRepo.findAllPublicIds.mockResolvedValue(['p1', 'p2']);
    mockInventoryRepo.getAvailableQuantityByProductIds.mockResolvedValue([{ _id: 'p1', totalAvailable: 5 }]);
    mockProductRepo.findPublicByFilter.mockResolvedValue({ items: [], total: 0 });
    mockProductService.buildPublicProductList.mockResolvedValue([]);

    await collectionService.resolveCollectionProducts(collection, { page: 1, limit: 12 });

    // p1 has stock (5 > 0), p2 has none (missing from the stock rows) - only
    // p1 should be injected into the rule filter's stock clause.
    expect(mockProductRepo.findPublicByFilter).toHaveBeenCalledWith({ _id: { $in: ['p1'] } }, { sortMode: 'newest', page: 1, limit: 12 });
  });
});

describe('collectionService.previewRuleMatchCount', () => {
  it('returns a cheap count without fetching full documents', async () => {
    mockProductRepo.findPublicIdsByFilter.mockResolvedValue(['p1', 'p2', 'p3']);
    const count = await collectionService.previewRuleMatchCount({ matchMode: 'all', conditions: [{ field: 'featured', operator: 'equals', value: true }] });
    expect(count).toBe(3);
    expect(mockProductRepo.findPublicByIds).not.toHaveBeenCalled();
  });
});

describe('collectionService.runAutoPublishSweep / runAutoArchiveSweep', () => {
  it('publishes every collection due for auto-publish and returns the count', async () => {
    mockCollectionRepo.findDueForAutoPublish.mockResolvedValue([{ _id: 'c1' }, { _id: 'c2' }]);

    const count = await collectionService.runAutoPublishSweep();

    expect(count).toBe(2);
    expect(mockCollectionRepo.updateManyStatus).toHaveBeenCalledWith(['c1', 'c2'], 'published');
  });

  it('does nothing when no collection is due for auto-publish', async () => {
    mockCollectionRepo.findDueForAutoPublish.mockResolvedValue([]);

    const count = await collectionService.runAutoPublishSweep();

    expect(count).toBe(0);
    expect(mockCollectionRepo.updateManyStatus).not.toHaveBeenCalled();
  });

  it('archives every collection due for auto-archive and returns the count', async () => {
    mockCollectionRepo.findDueForAutoArchive.mockResolvedValue([{ _id: 'c3' }]);

    const count = await collectionService.runAutoArchiveSweep();

    expect(count).toBe(1);
    expect(mockCollectionRepo.updateManyStatus).toHaveBeenCalledWith(['c3'], 'archived');
  });
});
