import { jest } from '@jest/globals';

const mockRepo = {
  findById: jest.fn(),
  findBySlug: jest.fn(),
  findByIdWithParentChain: jest.fn(),
  findByIdIncludingDeleted: jest.fn(),
  findDirectChildrenCount: jest.fn(),
  findDirectChildren: jest.fn(),
  findChildrenNotIn: jest.fn(),
  findFlatPaginated: jest.fn(),
  findTrashedPaginated: jest.fn(),
  findAll: jest.fn(),
  searchAutocomplete: jest.fn(),
  create: jest.fn(),
  updateById: jest.fn(),
  deleteById: jest.fn(),
  deleteByIds: jest.fn(),
  softDeleteById: jest.fn(),
  softDeleteMany: jest.fn(),
  restoreById: jest.fn(),
  updateManyStatus: jest.fn(),
  recomputeAncestors: jest.fn(),
  reparentChildren: jest.fn(),
  incrementProductCount: jest.fn(),
  getSubtreeProductCounts: jest.fn(),
  findForAnalytics: jest.fn(),
  findPublicBySlug: jest.fn(),
  findPublicTree: jest.fn(),
  findFeatured: jest.fn(),
  findHomepage: jest.fn(),
  findNavbar: jest.fn(),
  findTrending: jest.fn(),
  incrementViewCount: jest.fn(),
  incrementClickCount: jest.fn(),
  findPublicPaginated: jest.fn(),
};

jest.unstable_mockModule('../src/modules/category/category.repository.js', () => ({
  categoryRepository: mockRepo,
}));

// Best-effort in the real service (never throws) - mocked here purely so
// tests don't hit a real, unconnected Mongo model through it.
const mockActivityLogService = { record: jest.fn() };
jest.unstable_mockModule('../src/modules/activityLog/activityLog.service.js', () => ({
  activityLogService: mockActivityLogService,
}));

const mockProductRepo = {
  countByCategory: jest.fn(),
  reassignCategory: jest.fn(),
};
jest.unstable_mockModule('../src/modules/product/product.repository.js', () => ({
  productRepository: mockProductRepo,
}));

const mockRedis = {
  get: jest.fn(),
  set: jest.fn(),
  del: jest.fn(),
};
jest.unstable_mockModule('../src/config/redis.js', () => ({
  redisClient: mockRedis,
}));

// updateCategory wraps the reparent + ancestor-recompute in a transaction
// (matching product.service.js's existing pattern) - mongoose itself is
// mocked out here the same way product.service.test.js does it, so this
// stays a pure unit test with no real Mongo connection required.
const mockSession = {
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  abortTransaction: jest.fn(),
  endSession: jest.fn(),
};
jest.unstable_mockModule('mongoose', () => ({
  default: { startSession: jest.fn(() => Promise.resolve(mockSession)) },
}));

const { categoryService } = await import('../src/modules/category/category.service.js');

beforeEach(() => {
  Object.values(mockRepo).forEach((fn) => fn.mockReset());
  Object.values(mockProductRepo).forEach((fn) => fn.mockReset());
  Object.values(mockRedis).forEach((fn) => fn.mockReset());
  Object.values(mockSession).forEach((fn) => fn.mockReset());
  Object.values(mockActivityLogService).forEach((fn) => fn.mockReset());
  mockRedis.get.mockResolvedValue(null);
  mockRepo.getSubtreeProductCounts.mockResolvedValue(new Map());
  mockRepo.incrementViewCount.mockResolvedValue();
});

describe('categoryService.createCategory', () => {
  it('throws when the selected parent does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(categoryService.createCategory({ name: 'Gold Rings', parent: 'p1' })).rejects.toThrow(
      'Selected parent category does not exist'
    );
  });

  it('creates the category when the parent is valid', async () => {
    mockRepo.findById.mockResolvedValue({ _id: 'p1', ancestors: [] });
    mockRepo.create.mockResolvedValue({ _id: 'c1', name: 'Gold Rings', parent: 'p1', ancestors: ['p1'] });

    const result = await categoryService.createCategory({ name: 'Gold Rings', parent: 'p1' }, 'user1');

    expect(result.name).toBe('Gold Rings');
    expect(mockRepo.create).toHaveBeenCalledWith({
      name: 'Gold Rings',
      parent: 'p1',
      createdBy: 'user1',
      updatedBy: 'user1',
    });
  });
});

describe('categoryService.updateCategory', () => {
  it('rejects assigning a category as its own parent', async () => {
    await expect(categoryService.updateCategory('c1', { parent: 'c1' })).rejects.toThrow(
      'A category cannot be its own parent'
    );
  });

  it('rejects a circular reference (new parent is a descendant)', async () => {
    // "child1" descends from c1, so making child1 the parent of c1 would be circular.
    mockRepo.findById.mockResolvedValue({ _id: 'child1', ancestors: ['c1'] });

    await expect(categoryService.updateCategory('c1', { parent: 'child1' })).rejects.toThrow(
      'circular reference'
    );
  });

  it('recomputes descendant ancestors after a successful reparent', async () => {
    mockRepo.findById.mockResolvedValue({ _id: 'p2', ancestors: [] });
    mockRepo.updateById.mockResolvedValue({ _id: 'c1', name: 'Rings', parent: 'p2' });

    await categoryService.updateCategory('c1', { parent: 'p2' });

    expect(mockRepo.recomputeAncestors).toHaveBeenCalledWith('c1', mockSession);
    expect(mockSession.commitTransaction).toHaveBeenCalled();
  });

  it('does not touch ancestors when parent is not part of the update', async () => {
    mockRepo.updateById.mockResolvedValue({ _id: 'c1', name: 'Rings Renamed' });

    await categoryService.updateCategory('c1', { name: 'Rings Renamed' });

    expect(mockRepo.recomputeAncestors).not.toHaveBeenCalled();
  });

  it('throws 404 when the category does not exist', async () => {
    mockRepo.updateById.mockResolvedValue(null);

    await expect(categoryService.updateCategory('missing', { name: 'X' })).rejects.toThrow('Category not found');
    expect(mockSession.abortTransaction).toHaveBeenCalled();
  });
});

describe('categoryService.deleteCategory', () => {
  it('blocks deletion when subcategories exist', async () => {
    mockRepo.findDirectChildrenCount.mockResolvedValue(2);

    await expect(categoryService.deleteCategory('c1')).rejects.toThrow(
      'Cannot delete a category that has subcategories'
    );
    expect(mockRepo.softDeleteById).not.toHaveBeenCalled();
  });

  it('blocks deletion when products are still assigned', async () => {
    mockRepo.findDirectChildrenCount.mockResolvedValue(0);
    mockProductRepo.countByCategory.mockResolvedValue(3);

    await expect(categoryService.deleteCategory('c1')).rejects.toThrow(
      'products assigned'
    );
    expect(mockRepo.softDeleteById).not.toHaveBeenCalled();
  });

  it('soft-deletes when there are no subcategories or products', async () => {
    mockRepo.findDirectChildrenCount.mockResolvedValue(0);
    mockProductRepo.countByCategory.mockResolvedValue(0);
    mockRepo.softDeleteById.mockResolvedValue({ _id: 'c1', isDeleted: true });

    await categoryService.deleteCategory('c1', 'user1');

    expect(mockRepo.softDeleteById).toHaveBeenCalledWith('c1', 'user1');
    expect(mockRepo.deleteById).not.toHaveBeenCalled();
  });
});

describe('categoryService.restoreCategory', () => {
  it('throws 404 when the category is not in the trash', async () => {
    mockRepo.restoreById.mockResolvedValue(null);

    await expect(categoryService.restoreCategory('c1', 'user1')).rejects.toThrow('Category not found in trash');
  });

  it('restores a trashed category', async () => {
    mockRepo.restoreById.mockResolvedValue({ _id: 'c1', isDeleted: false });

    const result = await categoryService.restoreCategory('c1', 'user1');

    expect(result.id).toBe('c1');
  });
});

describe('categoryService.searchCategories', () => {
  it('returns serialized autocomplete matches', async () => {
    mockRepo.searchAutocomplete.mockResolvedValue([
      { _id: 'c1', name: 'Gold Rings', slug: 'gold-rings', parent: null },
    ]);

    const result = await categoryService.searchCategories('gold', 10);

    expect(mockRepo.searchAutocomplete).toHaveBeenCalledWith('gold', 10);
    expect(result).toEqual([{ id: 'c1', name: 'Gold Rings', slug: 'gold-rings', parentName: null }]);
  });
});

describe('categoryService.importCategoriesCsv', () => {
  it('creates a category from a valid row and skips a row missing a name', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);
    mockRepo.create.mockResolvedValue({ _id: 'c1', name: 'Gold Rings' });

    const header =
      'name,slug,parentSlug,description,shortDescription,skuPrefix,status,isFeatured,showInNavbar,showOnHomepage,isVisible,order,metaTitle,metaDescription,metaKeywords';
    const validRow = 'Gold Rings,gold-rings,,,,,,,,,,,,,';
    const invalidRow = ',,,,,,,,,,,,,,';
    const csv = `${header}\n${validRow}\n${invalidRow}\n`;

    const result = await categoryService.importCategoriesCsv(Buffer.from(csv), 'user1');

    expect(result.created).toBe(1);
    expect(result.skipped).toBe(1);
    expect(mockRepo.create).toHaveBeenCalledTimes(1);
  });

  it('skips a row whose parent slug cannot be found', async () => {
    mockRepo.findBySlug.mockResolvedValue(null);

    const header = 'name,slug,parentSlug';
    const csv = `${header}\nDiamond Solitaire,diamond-solitaire,missing-parent\n`;

    const result = await categoryService.importCategoriesCsv(Buffer.from(csv), 'user1');

    expect(result.skipped).toBe(1);
    expect(result.errors[0].message).toMatch(/Parent category with slug/);
    expect(mockRepo.create).not.toHaveBeenCalled();
  });
});

describe('categoryService.bulkDelete', () => {
  it('blocks the batch when a subcategory sits outside the selection', async () => {
    mockRepo.findChildrenNotIn.mockResolvedValue([{ _id: 'orphan', name: 'Orphan' }]);

    await expect(categoryService.bulkDelete(['a', 'b'])).rejects.toThrow(
      'subcategories outside this selection'
    );
    expect(mockRepo.softDeleteMany).not.toHaveBeenCalled();
  });

  it('blocks the batch when any selected category still has products', async () => {
    mockRepo.findChildrenNotIn.mockResolvedValue([]);
    mockProductRepo.countByCategory.mockResolvedValueOnce(0).mockResolvedValueOnce(1);

    await expect(categoryService.bulkDelete(['a', 'b'])).rejects.toThrow('products assigned');
    expect(mockRepo.softDeleteMany).not.toHaveBeenCalled();
  });

  it('soft-deletes the whole batch when it is self-contained and unused', async () => {
    mockRepo.findChildrenNotIn.mockResolvedValue([]);
    mockProductRepo.countByCategory.mockResolvedValue(0);

    await categoryService.bulkDelete(['a', 'b'], 'user1');

    expect(mockRepo.softDeleteMany).toHaveBeenCalledWith(['a', 'b'], 'user1');
  });
});

describe('categoryService.duplicateCategory', () => {
  it('creates a draft copy with a distinguishing name', async () => {
    mockRepo.findById.mockResolvedValue({
      _id: 'orig',
      name: 'Rings',
      description: '',
      shortDescription: '',
      parent: null,
      iconMedia: null,
      bannerMedia: null,
      thumbnailMedia: null,
      isVisible: true,
      order: 0,
      seo: {},
    });
    mockRepo.create.mockResolvedValue({ _id: 'copy1', name: 'Rings (Copy)', status: 'draft' });

    const result = await categoryService.duplicateCategory('orig');

    expect(mockRepo.create).toHaveBeenCalledWith(
      expect.objectContaining({ name: 'Rings (Copy)', status: 'draft', isFeatured: false })
    );
    expect(result.name).toBe('Rings (Copy)');
  });

  it('throws 404 when the source category does not exist', async () => {
    mockRepo.findById.mockResolvedValue(null);

    await expect(categoryService.duplicateCategory('missing')).rejects.toThrow('Category not found');
  });
});

describe('categoryService.mergeCategories', () => {
  it('rejects merging a category into itself', async () => {
    await expect(categoryService.mergeCategories('c1', 'c1', 'user1')).rejects.toThrow(
      'Cannot merge a category into itself'
    );
  });

  it('throws 404 when the source category does not exist', async () => {
    mockRepo.findById.mockResolvedValueOnce(null).mockResolvedValueOnce({ _id: 't1', ancestors: [] });

    await expect(categoryService.mergeCategories('missing', 't1', 'user1')).rejects.toThrow(
      'Source category not found'
    );
  });

  it('throws 404 when the target category does not exist', async () => {
    mockRepo.findById.mockResolvedValueOnce({ _id: 's1', name: 'Source', ancestors: [] }).mockResolvedValueOnce(null);

    await expect(categoryService.mergeCategories('s1', 'missing', 'user1')).rejects.toThrow(
      'Target category not found'
    );
  });

  it('rejects merging into a descendant of the source', async () => {
    mockRepo.findById
      .mockResolvedValueOnce({ _id: 's1', name: 'Source', ancestors: [] })
      .mockResolvedValueOnce({ _id: 't1', name: 'Target', ancestors: ['s1'] });

    await expect(categoryService.mergeCategories('s1', 't1', 'user1')).rejects.toThrow('descendant');
  });

  it('moves products and children onto the target, then soft-deletes the source', async () => {
    mockRepo.findById
      .mockResolvedValueOnce({ _id: 's1', name: 'Source', ancestors: [] })
      .mockResolvedValueOnce({ _id: 't1', name: 'Target', ancestors: [] });
    mockProductRepo.countByCategory.mockResolvedValue(5);
    mockRepo.findDirectChildren.mockResolvedValue([{ _id: 'child1' }, { _id: 'child2' }]);
    mockRepo.findByIdWithParentChain.mockResolvedValue({ _id: 't1', name: 'Target', ancestors: [] });

    const result = await categoryService.mergeCategories('s1', 't1', 'user1');

    expect(mockProductRepo.reassignCategory).toHaveBeenCalledWith('s1', 't1', mockSession);
    expect(mockRepo.reparentChildren).toHaveBeenCalledWith('s1', 't1', mockSession);
    expect(mockRepo.recomputeAncestors).toHaveBeenCalledTimes(2);
    expect(mockRepo.incrementProductCount).toHaveBeenCalledWith('t1', 5, mockSession);
    expect(mockRepo.softDeleteById).toHaveBeenCalledWith('s1', 'user1', mockSession);
    expect(mockSession.commitTransaction).toHaveBeenCalled();
    expect(result.id).toBe('t1');
  });
});

describe('categoryService.getAnalytics', () => {
  it('computes the click-through rate per category', async () => {
    mockRepo.findForAnalytics.mockResolvedValue({
      items: [{ _id: 'c1', name: 'Rings', slug: 'rings', productCount: 10, viewCount: 200, clickCount: 50 }],
      total: 1,
    });

    const result = await categoryService.getAnalytics({ page: 1, limit: 20, sortBy: 'viewCount' });

    expect(result.items[0].clickThroughRate).toBe(0.25);
    expect(result.meta.totalItems).toBe(1);
  });

  it('avoids dividing by zero when a category has no views', async () => {
    mockRepo.findForAnalytics.mockResolvedValue({
      items: [{ _id: 'c1', name: 'Rings', slug: 'rings', productCount: 0, viewCount: 0, clickCount: 0 }],
      total: 1,
    });

    const result = await categoryService.getAnalytics({ page: 1, limit: 20, sortBy: 'viewCount' });

    expect(result.items[0].clickThroughRate).toBe(0);
  });
});

describe('categoryService.getPublicCategoryBySlug', () => {
  it('throws 404 when no published, visible category matches the slug', async () => {
    mockRepo.findPublicBySlug.mockResolvedValue(null);

    await expect(categoryService.getPublicCategoryBySlug('missing')).rejects.toThrow('Category not found');
  });

  it('returns the category and records a view', async () => {
    mockRepo.findPublicBySlug.mockResolvedValue({ _id: 'c1', name: 'Rings', slug: 'rings', ancestors: [] });

    const result = await categoryService.getPublicCategoryBySlug('rings');

    expect(result.slug).toBe('rings');
    expect(mockRepo.incrementViewCount).toHaveBeenCalledWith('c1');
  });
});

describe('categoryService.listPublicCategories', () => {
  it('returns paginated, serialized categories with recursive product counts', async () => {
    mockRepo.findPublicPaginated.mockResolvedValue({ items: [{ _id: 'c1', name: 'Rings', slug: 'rings', ancestors: [] }], total: 1 });
    mockRepo.getSubtreeProductCounts.mockResolvedValue(new Map([['c1', 5]]));

    const result = await categoryService.listPublicCategories({ page: 1, limit: 20 });

    expect(result.items).toHaveLength(1);
    expect(result.items[0].productCountRecursive).toBe(5);
    expect(result.meta).toEqual({ page: 1, limit: 20, totalItems: 1, totalPages: 1 });
  });
});

describe('categoryService.trackCategoryClick', () => {
  it('increments the click counter for the given category', async () => {
    await categoryService.trackCategoryClick('c1');

    expect(mockRepo.incrementClickCount).toHaveBeenCalledWith('c1');
  });
});
