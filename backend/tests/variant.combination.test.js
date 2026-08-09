import {
  buildCombinationKey,
  generateAttributeCombinations,
} from '../src/modules/product/variant/variant.combination.js';

describe('buildCombinationKey', () => {
  it('is order-independent - the same pairs in any order produce the same key', () => {
    const keyA = buildCombinationKey([
      { attribute: 'size', value: '18' },
      { attribute: 'purity', value: '22k' },
    ]);
    const keyB = buildCombinationKey([
      { attribute: 'purity', value: '22k' },
      { attribute: 'size', value: '18' },
    ]);

    expect(keyA).toBe(keyB);
  });

  it('produces different keys for different combinations', () => {
    const key18 = buildCombinationKey([{ attribute: 'size', value: '18' }]);
    const key20 = buildCombinationKey([{ attribute: 'size', value: '20' }]);

    expect(key18).not.toBe(key20);
  });

  it('returns an empty string for an empty attribute list', () => {
    expect(buildCombinationKey([])).toBe('');
  });
});

describe('generateAttributeCombinations', () => {
  it('produces one combination per value for a single attribute', () => {
    const combinations = generateAttributeCombinations([{ attributeId: 'size', valueIds: ['18', '20', '22'] }]);

    expect(combinations).toHaveLength(3);
    expect(combinations).toEqual([
      [{ attribute: 'size', value: '18' }],
      [{ attribute: 'size', value: '20' }],
      [{ attribute: 'size', value: '22' }],
    ]);
  });

  it('produces the full cartesian product across multiple attributes', () => {
    const combinations = generateAttributeCombinations([
      { attributeId: 'size', valueIds: ['18', '20'] },
      { attributeId: 'purity', valueIds: ['18k', '22k', '24k'] },
    ]);

    // 2 sizes x 3 purities = 6 combinations, and every one must be unique.
    expect(combinations).toHaveLength(6);
    const keys = new Set(combinations.map((c) => buildCombinationKey(c)));
    expect(keys.size).toBe(6);

    expect(combinations).toContainEqual([
      { attribute: 'size', value: '18' },
      { attribute: 'purity', value: '22k' },
    ]);
  });

  it('returns a single empty combination when no attributes are given', () => {
    expect(generateAttributeCombinations([])).toEqual([[]]);
  });
});
