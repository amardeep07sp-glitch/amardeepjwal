import { jest } from '@jest/globals';

const mockArticleRepo = {
  findPaginated: jest.fn(),
  findById: jest.fn(),
  findBySlug: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  findPublished: jest.fn(),
  findFeaturedPublished: jest.fn(),
  countPublishedByCategory: jest.fn(),
  incrementView: jest.fn(),
  incrementHelpfulVote: jest.fn(),
};

const mockSearchLogRepo = { create: jest.fn(), getTopQueries: jest.fn(), getSummary: jest.fn() };
const mockCategoryRepo = { ensureSeeded: jest.fn(), findAllOrdered: jest.fn(), findByCode: jest.fn(), updateByCode: jest.fn() };

jest.unstable_mockModule('../src/modules/help/helpArticle.repository.js', () => ({ helpArticleRepository: mockArticleRepo }));
jest.unstable_mockModule('../src/modules/help/helpSearchLog.repository.js', () => ({ helpSearchLogRepository: mockSearchLogRepo }));
jest.unstable_mockModule('../src/modules/help/helpCategory.repository.js', () => ({ helpCategoryRepository: mockCategoryRepo }));

const { helpService } = await import('../src/modules/help/help.service.js');

const allCategoryRows = () =>
  ['orders', 'payments', 'shipping', 'returns_refunds', 'coupons_offers', 'jewellery_pricing', 'account', 'invoice', 'wishlist', 'reviews', 'website', 'security'].map(
    (code) => ({ code, label: code, active: true })
  );

beforeEach(() => {
  Object.values(mockArticleRepo).forEach((fn) => fn.mockReset());
  Object.values(mockSearchLogRepo).forEach((fn) => fn.mockReset());
  Object.values(mockCategoryRepo).forEach((fn) => fn.mockReset());
  mockArticleRepo.incrementView.mockResolvedValue(undefined);
  mockSearchLogRepo.create.mockResolvedValue(undefined);
  mockCategoryRepo.findAllOrdered.mockResolvedValue(allCategoryRows());
});

describe('help.service#listCategories', () => {
  it('returns all 12 fixed categories even when some have zero published articles', async () => {
    mockArticleRepo.countPublishedByCategory.mockResolvedValue(new Map([['orders', 3]]));
    const categories = await helpService.listCategories();
    expect(categories).toHaveLength(12);
    expect(categories.find((c) => c.value === 'orders').articleCount).toBe(3);
    expect(categories.find((c) => c.value === 'security').articleCount).toBe(0);
  });

  it('never shows a category an admin has deactivated', async () => {
    mockCategoryRepo.findAllOrdered.mockResolvedValue([...allCategoryRows().slice(0, 11), { code: 'security', label: 'Security', active: false }]);
    mockArticleRepo.countPublishedByCategory.mockResolvedValue(new Map());

    const categories = await helpService.listCategories();

    expect(categories).toHaveLength(11);
    expect(categories.find((c) => c.value === 'security')).toBeUndefined();
  });
});

describe('help.service#updateCategory', () => {
  it('404s when the category code does not exist', async () => {
    mockCategoryRepo.updateByCode.mockResolvedValue(null);
    await expect(helpService.updateCategory('orders', { label: 'My Orders' }, 'user1')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('updates the display metadata for a real category', async () => {
    mockCategoryRepo.updateByCode.mockResolvedValue({ code: 'orders', label: 'My Orders' });
    const result = await helpService.updateCategory('orders', { label: 'My Orders' }, 'user1');
    expect(result.label).toBe('My Orders');
    expect(mockCategoryRepo.updateByCode).toHaveBeenCalledWith('orders', { label: 'My Orders' }, 'user1');
  });
});

describe('help.service#getPublishedArticleBySlug', () => {
  it('404s for a slug that does not exist', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue(null);
    await expect(helpService.getPublishedArticleBySlug('nope')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('404s for a real article that is still draft (never leaks unpublished content)', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue({ _id: 'a1', slug: 'making-charges', status: 'draft' });
    await expect(helpService.getPublishedArticleBySlug('making-charges')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns a published article and best-effort increments its view count', async () => {
    const article = { _id: 'a1', slug: 'making-charges', status: 'published' };
    mockArticleRepo.findBySlug.mockResolvedValue(article);

    const result = await helpService.getPublishedArticleBySlug('making-charges');

    expect(result).toBe(article);
    expect(mockArticleRepo.incrementView).toHaveBeenCalledWith('a1');
  });

  it('never lets a view-count failure break the read', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue({ _id: 'a1', slug: 'x', status: 'published' });
    mockArticleRepo.incrementView.mockRejectedValue(new Error('db hiccup'));

    await expect(helpService.getPublishedArticleBySlug('x')).resolves.toBeDefined();
  });
});

describe('help.service#voteHelpful', () => {
  it('404s when voting on a non-published article', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue(null);
    await expect(helpService.voteHelpful('nope', true)).rejects.toMatchObject({ statusCode: 404 });
  });

  it('records a helpful vote and returns the updated counts', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue({ _id: 'a1', status: 'published' });
    mockArticleRepo.incrementHelpfulVote.mockResolvedValue({ helpfulCount: 5, notHelpfulCount: 1 });

    const result = await helpService.voteHelpful('making-charges', true);

    expect(mockArticleRepo.incrementHelpfulVote).toHaveBeenCalledWith('a1', true);
    expect(result).toEqual({ helpfulCount: 5, notHelpfulCount: 1 });
  });
});

describe('help.service#createArticle', () => {
  it('rejects a duplicate slug', async () => {
    mockArticleRepo.findBySlug.mockResolvedValue({ _id: 'existing' });
    await expect(helpService.createArticle({ title: 'Gold Purity Guide', slug: 'gold-purity-guide' }, 'user1')).rejects.toMatchObject({ statusCode: 409 });
    expect(mockArticleRepo.create).not.toHaveBeenCalled();
  });
});

describe('help.service#search', () => {
  it('logs a real typed query with its result count', async () => {
    mockArticleRepo.findPublished.mockResolvedValue({ items: [{ id: 'a1' }], total: 1 });

    await helpService.search({ page: 1, limit: 10, search: 'gold rate' }, 'user1');

    expect(mockSearchLogRepo.create).toHaveBeenCalledWith({ query: 'gold rate', resultCount: 1, userId: 'user1' });
  });

  it('logs a zero-result search too (that is the point of no-result tracking)', async () => {
    mockArticleRepo.findPublished.mockResolvedValue({ items: [], total: 0 });

    await helpService.search({ page: 1, limit: 10, search: 'unobtainium ring' }, undefined);

    expect(mockSearchLogRepo.create).toHaveBeenCalledWith({ query: 'unobtainium ring', resultCount: 0, userId: null });
  });

  it('does not log a bare category-browse with no typed query', async () => {
    mockArticleRepo.findPublished.mockResolvedValue({ items: [], total: 0 });

    await helpService.search({ page: 1, limit: 10, category: 'orders' }, 'user1');

    expect(mockSearchLogRepo.create).not.toHaveBeenCalled();
  });
});

describe('help.service#getSearchAnalytics', () => {
  it('combines summary + top queries + no-result queries', async () => {
    mockSearchLogRepo.getSummary.mockResolvedValue({ totalSearches: 10, noResultSearches: 2 });
    mockSearchLogRepo.getTopQueries.mockResolvedValueOnce([{ query: 'gold rate', count: 5 }]).mockResolvedValueOnce([{ query: 'unobtainium', count: 1 }]);

    const result = await helpService.getSearchAnalytics();

    expect(result).toEqual({
      totalSearches: 10,
      noResultSearches: 2,
      topQueries: [{ query: 'gold rate', count: 5 }],
      noResultQueries: [{ query: 'unobtainium', count: 1 }],
    });
  });
});
