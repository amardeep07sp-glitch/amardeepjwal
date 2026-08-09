import { buildSkuPrefix, generateSku } from '../src/modules/product/sku.generator.js';

describe('buildSkuPrefix', () => {
  it('joins category, brand, and collection prefixes with dashes', () => {
    expect(buildSkuPrefix({ categoryPrefix: 'rg', brandPrefix: 'tan', collectionPrefix: 'wed' })).toBe('RG-TAN-WED');
  });

  it('skips missing prefixes rather than leaving empty segments', () => {
    expect(buildSkuPrefix({ categoryPrefix: 'rg' })).toBe('RG');
  });

  it('falls back to a generic prefix when nothing is provided', () => {
    expect(buildSkuPrefix({})).toBe('PRD');
    expect(buildSkuPrefix()).toBe('PRD');
  });
});

describe('generateSku', () => {
  it('pads the sequence number to 6 digits', () => {
    expect(generateSku('RG', 42)).toBe('RG-000042');
  });

  it('does not truncate a sequence number longer than 6 digits', () => {
    expect(generateSku('RG', 1234567)).toBe('RG-1234567');
  });
});
