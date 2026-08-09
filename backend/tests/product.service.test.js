import { jest } from '@jest/globals';

const mockRepo = {
  findPaginated: jest.fn(),
  findById: jest.fn(),
  findRawById: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  deleteByIds: jest.fn(),
  updateManyStatus: jest.fn(),
  countByPrefix: jest.fn(),
  countsByCategoryForIds: jest.fn(),
  findPublicNewArrivals: jest.fn(),
  findPublicFeatured: jest.fn(),
  findPublicByIds: jest.fn(),
  findPublicBySlug: jest.fn(),
  findPublicSimilar: jest.fn(),
  findPublicPaginated: jest.fn(),
  getPublicPriceRange: jest.fn(),
  getPublicTagCounts: jest.fn(),
  getPublicGenderCounts: jest.fn(),
  getPublicOccasionCounts: jest.fn(),
  getPublicBrandCounts: jest.fn(),
  searchAutocomplete: jest.fn(),
};

jest.unstable_mockModule('../src/modules/product/product.repository.js', () => ({
  productRepository: mockRepo,
}));

const mockInventoryService = {
  provisionForProduct: jest.fn(),
};
jest.unstable_mockModule('../src/modules/inventory/inventory.service.js', () => ({
  inventoryService: mockInventoryService,
}));

// SKU generation reads these to build a prefix - mocked out (rather than
// left to their real, Mongoose-model-backed implementations) since this
// file also mocks 'mongoose' below for the transaction session, which would
// otherwise break category/brand/collection.model.js's real schema
// definitions (they need the real mongoose.Schema.Types.ObjectId).
const mockCategoryRepo = {
  findById: jest.fn(),
  incrementProductCount: jest.fn(),
  findPublicBySlug: jest.fn(),
  findPublicPaginated: jest.fn(),
  getSubtreeProductCounts: jest.fn(),
  searchAutocomplete: jest.fn(),
};
jest.unstable_mockModule('../src/modules/category/category.repository.js', () => ({
  categoryRepository: mockCategoryRepo,
}));
const mockBrandRepo = { findById: jest.fn(), findAllPublicIds: jest.fn() };
jest.unstable_mockModule('../src/modules/brand/brand.repository.js', () => ({
  brandRepository: mockBrandRepo,
}));
jest.unstable_mockModule('../src/modules/collection/collection.repository.js', () => ({
  collectionRepository: { findById: jest.fn() },
}));

// Public storefront reads (getPublicNewArrivals/getPublicFeatured/
// getPublicProductBySlug) pull inventory availability + a cover image -
// both mocked out for the same reason as category/brand/collection above:
// their real repositories load real, mongoose.Schema-backed models, which
// the mocked 'mongoose' module below can't satisfy.
const mockInventoryRepo = {
  getAvailableQuantityByProductIds: jest.fn(),
  getAvailableQuantityByVariantIds: jest.fn(),
};
jest.unstable_mockModule('../src/modules/inventory/inventory.repository.js', () => ({
  inventoryRepository: mockInventoryRepo,
}));
const mockMediaRepo = { findPrimaryByEntityIds: jest.fn(), findPublicGalleryByEntity: jest.fn() };
jest.unstable_mockModule('../src/modules/media/media.repository.js', () => ({
  mediaRepository: mockMediaRepo,
}));
const mockVariantRepo = { findPublicByProduct: jest.fn() };
jest.unstable_mockModule('../src/modules/product/variant/variant.repository.js', () => ({
  variantRepository: mockVariantRepo,
}));

// getPublicTrending's ranking signal - same "real repository loads a real
// mongoose.Schema-backed model" conflict with the mocked 'mongoose' below.
const mockOrderItemRepo = { getTrendingProductIds: jest.fn() };
jest.unstable_mockModule('../src/modules/order/orderItem.repository.js', () => ({
  orderItemRepository: mockOrderItemRepo,
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

const { productService } = await import('../src/modules/product/product.service.js');

beforeEach(() => {
  Object.values(mockRepo).forEach((fn) => fn.mockReset());
  Object.values(mockInventoryService).forEach((fn) => fn.mockReset());
  Object.values(mockCategoryRepo).forEach((fn) => fn.mockReset());
  Object.values(mockSession).forEach((fn) => fn.mockReset());
  Object.values(mockInventoryRepo).forEach((fn) => fn.mockReset());
  Object.values(mockMediaRepo).forEach((fn) => fn.mockReset());
  Object.values(mockVariantRepo).forEach((fn) => fn.mockReset());
  Object.values(mockOrderItemRepo).forEach((fn) => fn.mockReset());
  mockRepo.countsByCategoryForIds.mockResolvedValue([]);
  // Most products have no variants - default every test to that, individual
  // tests override when they specifically want to exercise the variant path.
  mockVariantRepo.findPublicByProduct.mockResolvedValue([]);
});

describe('productService.updateProduct', () => {
  it('throws 404 when the product does not exist', async () => {
    mockRepo.updateById.mockResolvedValue(null);

    await expect(productService.updateProduct('missing', { name: 'X' })).rejects.toThrow('Product not found');
  });

  it('updates and returns the serialized product', async () => {
    mockRepo.findRawById.mockResolvedValue({ _id: 'p1', category: 'cat1' });
    mockRepo.updateById.mockResolvedValue({ _id: 'p1', name: 'Gold Ring', sku: 'RING-001' });

    const result = await productService.updateProduct('p1', { name: 'Gold Ring' });

    expect(result.name).toBe('Gold Ring');
    expect(mockRepo.updateById).toHaveBeenCalledWith('p1', { name: 'Gold Ring' });
  });
});

describe('productService.deleteProduct', () => {
  it('throws 404 when the product does not exist', async () => {
    mockRepo.deleteById.mockResolvedValue(null);

    await expect(productService.deleteProduct('missing')).rejects.toThrow('Product not found');
  });

  it('deletes an existing product', async () => {
    mockRepo.deleteById.mockResolvedValue({ _id: 'p1' });

    await productService.deleteProduct('p1');

    expect(mockRepo.deleteById).toHaveBeenCalledWith('p1');
  });
});

describe('productService.bulkDelete / bulkUpdateStatus', () => {
  it('delegates bulk delete to the repository', async () => {
    await productService.bulkDelete(['a', 'b']);
    expect(mockRepo.deleteByIds).toHaveBeenCalledWith(['a', 'b']);
  });

  it('delegates bulk status update to the repository', async () => {
    await productService.bulkUpdateStatus(['a', 'b'], 'published');
    expect(mockRepo.updateManyStatus).toHaveBeenCalledWith(['a', 'b'], 'published');
  });
});

describe('productService.duplicateProduct', () => {
  it('throws 404 when the source product does not exist', async () => {
    mockRepo.findRawById.mockResolvedValue(null);

    await expect(productService.duplicateProduct('missing')).rejects.toThrow('Product not found');
  });

  it('creates a draft copy with a distinguishing name and a new unique SKU', async () => {
    mockRepo.findRawById.mockResolvedValue({
      _id: 'orig',
      name: 'Gold Ring',
      sku: 'RING-001',
      shortDescription: '',
      description: '',
      isVisible: true,
      order: 0,
      category: 'cat1',
      brand: null,
      collectionId: null,
      attributeGroups: [],
      tags: [],
      searchKeywords: [],
      seo: {},
    });
    mockRepo.create.mockResolvedValue({ _id: 'copy1' });
    mockRepo.findById.mockResolvedValue({ _id: 'copy1', name: 'Gold Ring (Copy)', sku: 'RING-001-COPY-123' });

    const result = await productService.duplicateProduct('orig');

    expect(mockRepo.create).toHaveBeenCalledTimes(1);
    const createPayload = mockRepo.create.mock.calls[0][0];
    expect(createPayload.name).toBe('Gold Ring (Copy)');
    expect(createPayload.status).toBe('draft');
    expect(createPayload.isFeatured).toBe(false);
    // SKU must change - the original is unique-constrained in the DB.
    expect(createPayload.sku).not.toBe('RING-001');
    expect(createPayload.sku.startsWith('RING-001-COPY-')).toBe(true);
    expect(result.name).toBe('Gold Ring (Copy)');
  });

  it('increments the copy suffix instead of stacking it when duplicating a copy', async () => {
    mockRepo.findRawById.mockResolvedValue({
      _id: 'copy1',
      name: 'Gold Ring (Copy)',
      sku: 'RING-001-COPY-1',
      isVisible: true,
      order: 0,
      category: 'cat1',
      attributeGroups: [],
      tags: [],
      searchKeywords: [],
      seo: {},
    });
    mockRepo.create.mockResolvedValue({ _id: 'copy2' });
    mockRepo.findById.mockResolvedValue({ _id: 'copy2', name: 'Gold Ring (Copy 2)' });

    await productService.duplicateProduct('copy1');

    const createPayload = mockRepo.create.mock.calls[0][0];
    // Not "Gold Ring (Copy) (Copy)" - the whole point of the fix.
    expect(createPayload.name).toBe('Gold Ring (Copy 2)');
  });
});

describe('productService public storefront reads', () => {
  const product = {
    _id: 'p1',
    name: 'Gold Ring',
    slug: 'gold-ring',
    pricing: { mrp: 1000, finalPrice: 800, currency: 'INR' },
  };

  it('getPublicNewArrivals batches image + stock lookups and returns [] when empty', async () => {
    mockRepo.findPublicNewArrivals.mockResolvedValue([]);

    const result = await productService.getPublicNewArrivals(12);

    expect(result).toEqual([]);
    expect(mockInventoryRepo.getAvailableQuantityByProductIds).not.toHaveBeenCalled();
    expect(mockMediaRepo.findPrimaryByEntityIds).not.toHaveBeenCalled();
  });

  it('getPublicNewArrivals attaches the batched image and derives inStock from summed availability', async () => {
    mockRepo.findPublicNewArrivals.mockResolvedValue([product]);
    mockMediaRepo.findPrimaryByEntityIds.mockResolvedValue([{ _id: 'p1', doc: { cloudinary: { secureUrl: 'https://img/1.jpg' } } }]);
    mockInventoryRepo.getAvailableQuantityByProductIds.mockResolvedValue([{ _id: 'p1', totalAvailable: 3 }]);

    const [result] = await productService.getPublicNewArrivals(12);

    expect(result.inStock).toBe(true);
    expect(result.stockQuantity).toBe(3);
    expect(result.image.secureUrl).toBe('https://img/1.jpg');
    expect(result.price).toEqual({ mrp: 1000, finalPrice: 800, discountPercentage: 20, currency: 'INR' });
  });

  it('getPublicNewArrivals reports out of stock when availability sums to zero', async () => {
    mockRepo.findPublicNewArrivals.mockResolvedValue([product]);
    mockMediaRepo.findPrimaryByEntityIds.mockResolvedValue([]);
    mockInventoryRepo.getAvailableQuantityByProductIds.mockResolvedValue([{ _id: 'p1', totalAvailable: 0 }]);

    const [result] = await productService.getPublicNewArrivals(12);

    expect(result.inStock).toBe(false);
    expect(result.image).toBeNull();
  });

  it('getPublicProductBySlug throws 404 when no published/visible product matches', async () => {
    mockRepo.findPublicBySlug.mockResolvedValue(null);

    await expect(productService.getPublicProductBySlug('missing')).rejects.toThrow('Product not found');
  });

  it('getPublicProductBySlug returns the serialized product with its full gallery + stock', async () => {
    mockRepo.findPublicBySlug.mockResolvedValue(product);
    mockMediaRepo.findPublicGalleryByEntity.mockResolvedValue([
      { cloudinary: { secureUrl: 'https://img/1.jpg' } },
      { cloudinary: { secureUrl: 'https://img/2.jpg' } },
    ]);
    mockInventoryRepo.getAvailableQuantityByProductIds.mockResolvedValue([{ _id: 'p1', totalAvailable: 5 }]);

    const result = await productService.getPublicProductBySlug('gold-ring');

    expect(result.slug).toBe('gold-ring');
    expect(result.images).toHaveLength(2);
    expect(result.image.secureUrl).toBe('https://img/1.jpg');
    expect(result.inStock).toBe(true);
    // No variants configured for this product - the size selector data is
    // simply empty, not fabricated.
    expect(result.variants).toEqual([]);
    // costPrice must never reach the storefront; the rest of the jewellery
    // pricing fields (transparency, not a secret) do.
    expect(result.priceBreakdown).toBeDefined();
    expect(result).not.toHaveProperty('costPrice');
  });

  it('getPublicProductBySlug attaches per-variant stock when the product has variants', async () => {
    mockRepo.findPublicBySlug.mockResolvedValue(product);
    mockMediaRepo.findPublicGalleryByEntity.mockResolvedValue([]);
    mockInventoryRepo.getAvailableQuantityByProductIds.mockResolvedValue([]);
    mockVariantRepo.findPublicByProduct.mockResolvedValue([
      { _id: 'v1', slug: 'gold-ring-size-8', attributes: [] },
      { _id: 'v2', slug: 'gold-ring-size-9', attributes: [] },
    ]);
    mockInventoryRepo.getAvailableQuantityByVariantIds.mockResolvedValue([{ _id: 'v1', totalAvailable: 2 }]);

    const result = await productService.getPublicProductBySlug('gold-ring');

    expect(result.variants).toHaveLength(2);
    expect(result.variants.find((v) => v.id === 'v1').inStock).toBe(true);
    expect(result.variants.find((v) => v.id === 'v2').inStock).toBe(false);
  });
});

describe('productService.getPublicSimilarProducts', () => {
  it('returns [] for an unknown/unpublished slug instead of throwing', async () => {
    mockRepo.findPublicBySlug.mockResolvedValue(null);

    const result = await productService.getPublicSimilarProducts('missing', 8);

    expect(result).toEqual([]);
    expect(mockRepo.findPublicSimilar).not.toHaveBeenCalled();
  });

  it('excludes the viewed product and scopes to its own category', async () => {
    mockRepo.findPublicBySlug.mockResolvedValue({ _id: 'p1', category: 'cat1' });
    mockRepo.findPublicSimilar.mockResolvedValue([]);

    await productService.getPublicSimilarProducts('gold-ring', 8);

    expect(mockRepo.findPublicSimilar).toHaveBeenCalledWith('cat1', 'p1', 8);
  });
});

describe('productService.listPublicProducts', () => {
  it('returns an empty page (not a 404) for an unknown category slug', async () => {
    mockCategoryRepo.findPublicBySlug.mockResolvedValue(null);

    const result = await productService.listPublicProducts({ page: 1, limit: 12, category: 'missing' });

    expect(result).toEqual({ items: [], meta: { page: 1, limit: 12, totalItems: 0, totalPages: 1 } });
    expect(mockRepo.findPublicPaginated).not.toHaveBeenCalled();
  });

  it('resolves the category slug to an id before querying products', async () => {
    mockCategoryRepo.findPublicBySlug.mockResolvedValue({ _id: 'cat1', slug: 'rings' });
    mockRepo.findPublicPaginated.mockResolvedValue({ items: [], total: 0 });

    await productService.listPublicProducts({ page: 1, limit: 12, category: 'rings', sortBy: 'newest' });

    expect(mockRepo.findPublicPaginated).toHaveBeenCalledWith({
      page: 1,
      limit: 12,
      categoryIds: ['cat1'],
      tags: undefined,
      minPrice: undefined,
      maxPrice: undefined,
      sortBy: 'newest',
      onSale: undefined,
    });
  });

  it('passes a search term straight through to the repository (no category resolution needed)', async () => {
    mockRepo.findPublicPaginated.mockResolvedValue({ items: [], total: 0 });

    await productService.listPublicProducts({ page: 1, limit: 12, search: 'gold ring' });

    expect(mockCategoryRepo.findPublicBySlug).not.toHaveBeenCalled();
    expect(mockRepo.findPublicPaginated).toHaveBeenCalledWith(expect.objectContaining({ search: 'gold ring' }));
  });

  it('resolves multiple category slugs, skipping any that do not exist', async () => {
    mockCategoryRepo.findPublicBySlug.mockImplementation((slug) =>
      Promise.resolve(slug === 'rings' ? { _id: 'cat1' } : null)
    );
    mockRepo.findPublicPaginated.mockResolvedValue({ items: [], total: 0 });

    await productService.listPublicProducts({ page: 1, limit: 12, categories: ['rings', 'missing'] });

    expect(mockRepo.findPublicPaginated).toHaveBeenCalledWith(
      expect.objectContaining({ categoryIds: ['cat1'] })
    );
  });

  it('serializes the page with batched images/stock, same as any other public list', async () => {
    mockRepo.findPublicPaginated.mockResolvedValue({
      items: [{ _id: 'p1', name: 'Gold Ring', slug: 'gold-ring', pricing: { mrp: 1000, finalPrice: 1000 } }],
      total: 1,
    });
    mockMediaRepo.findPrimaryByEntityIds.mockResolvedValue([]);
    mockInventoryRepo.getAvailableQuantityByProductIds.mockResolvedValue([{ _id: 'p1', totalAvailable: 4 }]);

    const result = await productService.listPublicProducts({ page: 1, limit: 12 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].inStock).toBe(true);
    expect(result.meta.totalItems).toBe(1);
  });
});

describe('productService.getPublicFacets', () => {
  it('returns real category counts/price bounds/tags, dropping empty categories', async () => {
    mockCategoryRepo.findPublicPaginated.mockResolvedValue({
      items: [
        { _id: 'cat1', name: 'Rings', slug: 'rings', productCount: 2 },
        { _id: 'cat2', name: 'Empty Category', slug: 'empty', productCount: 0 },
      ],
      total: 2,
    });
    mockCategoryRepo.getSubtreeProductCounts.mockResolvedValue(new Map([['cat1', 2]]));
    mockRepo.getPublicPriceRange.mockResolvedValue({ min: 5000, max: 150000 });
    mockRepo.getPublicTagCounts.mockResolvedValue([{ _id: 'bestseller', count: 3 }]);
    mockRepo.getPublicGenderCounts.mockResolvedValue([{ _id: 'women', count: 5 }]);
    mockRepo.getPublicOccasionCounts.mockResolvedValue([{ _id: 'daily-wear', count: 4 }]);
    mockRepo.getPublicBrandCounts.mockResolvedValue([{ _id: 'brand1', count: 2 }]);
    mockBrandRepo.findAllPublicIds.mockResolvedValue([
      { _id: 'brand1', name: 'Cartier', slug: 'cartier' },
      { _id: 'brand2', name: 'Empty Brand', slug: 'empty-brand' },
    ]);

    const result = await productService.getPublicFacets();

    expect(result.categories).toEqual([{ id: 'cat1', name: 'Rings', slug: 'rings', productCount: 2 }]);
    expect(result.priceRange).toEqual({ min: 5000, max: 150000 });
    expect(result.tags).toEqual([{ tag: 'bestseller', count: 3 }]);
    expect(result.genders).toEqual([{ value: 'women', label: 'Women', count: 5 }]);
    expect(result.occasions).toEqual([{ value: 'daily-wear', label: 'Daily Wear', count: 4 }]);
    expect(result.brands).toEqual([{ id: 'brand1', name: 'Cartier', slug: 'cartier', productCount: 2 }]);
  });
});

describe('productService.getPublicTrending', () => {
  const productA = { _id: 'p1', name: 'Gold Ring', slug: 'gold-ring', pricing: { mrp: 1000, finalPrice: 800, currency: 'INR' } };
  const productB = { _id: 'p2', name: 'Diamond Necklace', slug: 'diamond-necklace', pricing: { mrp: 2000, finalPrice: 2000, currency: 'INR' } };
  const featuredC = { _id: 'p3', name: 'Silver Bangle', slug: 'silver-bangle', pricing: { mrp: 500, finalPrice: 500, currency: 'INR' } };

  beforeEach(() => {
    mockMediaRepo.findPrimaryByEntityIds.mockResolvedValue([]);
    mockInventoryRepo.getAvailableQuantityByProductIds.mockResolvedValue([]);
  });

  it('ranks by real units sold, re-ordered to match the ranking (not $in order)', async () => {
    mockOrderItemRepo.getTrendingProductIds.mockResolvedValue([
      { _id: 'p2', unitsSold: 9 },
      { _id: 'p1', unitsSold: 3 },
    ]);
    // Deliberately returned in a different order than ranked - findPublicByIds
    // doesn't preserve $in order, the service must re-sort itself.
    mockRepo.findPublicByIds.mockResolvedValue([productA, productB]);

    const result = await productService.getPublicTrending(2);

    expect(result.map((p) => p.slug)).toEqual(['diamond-necklace', 'gold-ring']);
    expect(mockRepo.findPublicFeatured).not.toHaveBeenCalled();
  });

  it('backfills from isFeatured, excluding duplicates, when fewer than `limit` have real recent sales', async () => {
    mockOrderItemRepo.getTrendingProductIds.mockResolvedValue([{ _id: 'p1', unitsSold: 3 }]);
    mockRepo.findPublicByIds.mockResolvedValue([productA]);
    mockRepo.findPublicFeatured.mockResolvedValue([productA, featuredC]);

    const result = await productService.getPublicTrending(2);

    expect(result.map((p) => p.slug)).toEqual(['gold-ring', 'silver-bangle']);
  });

  it('falls back entirely to isFeatured for a brand-new store with zero recent sales', async () => {
    mockOrderItemRepo.getTrendingProductIds.mockResolvedValue([]);
    mockRepo.findPublicFeatured.mockResolvedValue([featuredC]);

    const result = await productService.getPublicTrending(2);

    expect(result.map((p) => p.slug)).toEqual(['silver-bangle']);
    expect(mockRepo.findPublicByIds).not.toHaveBeenCalled();
  });
});

describe('productService.searchSuggestions', () => {
  it('combines real product + category autocomplete matches, each with a batched image', async () => {
    mockRepo.searchAutocomplete.mockResolvedValue([
      { _id: 'p1', name: 'Gold Ring', slug: 'gold-ring', pricing: { finalPrice: 25000 } },
    ]);
    mockCategoryRepo.searchAutocomplete.mockResolvedValue([{ _id: 'c1', name: 'Gold', slug: 'gold' }]);
    mockMediaRepo.findPrimaryByEntityIds.mockResolvedValue([
      { _id: 'p1', doc: { cloudinary: { secureUrl: 'https://img/1.jpg' } } },
    ]);

    const result = await productService.searchSuggestions({ q: 'gold', limit: 6 });

    expect(mockRepo.searchAutocomplete).toHaveBeenCalledWith('gold', 6);
    expect(mockCategoryRepo.searchAutocomplete).toHaveBeenCalledWith('gold', 4);
    expect(result.products).toEqual([
      { id: 'p1', name: 'Gold Ring', slug: 'gold-ring', image: expect.objectContaining({ secureUrl: 'https://img/1.jpg' }), price: { finalPrice: 25000 } },
    ]);
    expect(result.categories).toEqual([{ id: 'c1', name: 'Gold', slug: 'gold' }]);
  });

  it('skips the image batch lookup entirely when no products match', async () => {
    mockRepo.searchAutocomplete.mockResolvedValue([]);
    mockCategoryRepo.searchAutocomplete.mockResolvedValue([]);

    const result = await productService.searchSuggestions({ q: 'zzz', limit: 6 });

    expect(result).toEqual({ products: [], categories: [] });
    expect(mockMediaRepo.findPrimaryByEntityIds).not.toHaveBeenCalled();
  });
});
