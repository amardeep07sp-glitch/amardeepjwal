import { summarizeUsage, buildUsageConflictMessage } from '../src/modules/media/media.usage.js';

// findUsageForMedia/findUsedMediaIdSet/findMediaIdsWithExistingHome hit real
// Mongoose models directly (by design - they ARE the cross-module usage
// query layer), so they're exercised through the mocked integration tests in
// media.service.test.js rather than duplicated here. These two are pure and
// tested directly, same convention as priceCalculator.test.js.

describe('summarizeUsage', () => {
  it('groups usage entries by module and counts them', () => {
    const entries = [
      { module: 'Product', entityId: 'p1' },
      { module: 'Product', entityId: 'p2' },
      { module: 'Category', entityId: 'c1' },
    ];

    expect(summarizeUsage(entries)).toEqual([
      { module: 'Product', count: 2 },
      { module: 'Category', count: 1 },
    ]);
  });

  it('returns an empty array for no usage', () => {
    expect(summarizeUsage([])).toEqual([]);
  });
});

describe('buildUsageConflictMessage', () => {
  it('formats a human-readable summary of where media is used', () => {
    const message = buildUsageConflictMessage([
      { module: 'Products', count: 3 },
      { module: 'Categories', count: 2 },
      { module: 'Banner', count: 1 },
    ]);

    expect(message).toBe('Cannot delete media. Currently used by Products (3), Categories (2), Banner (1).');
  });
});
