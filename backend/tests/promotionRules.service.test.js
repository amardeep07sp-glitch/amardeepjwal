import { productMatchesScope, hasEligibleItems } from '../src/modules/coupon/promotionRules.service.js';

const product = (overrides = {}) => ({
  _id: 'prod1',
  category: 'catRings',
  categoryAncestors: ['catJewellery'],
  brand: 'brand1',
  collectionId: 'colWedding',
  metal: 'gold',
  purity: '22K',
  gemstoneType: 'none',
  pricing: { finalPrice: 25000, mrp: 25000 },
  ...overrides,
});

describe('promotionRules.service#productMatchesScope', () => {
  it('matches everything when scope is empty', () => {
    expect(productMatchesScope({}, product())).toBe(true);
  });

  it('matches a product directly in includeProducts', () => {
    expect(productMatchesScope({ includeProducts: ['prod1'] }, product())).toBe(true);
    expect(productMatchesScope({ includeProducts: ['other'] }, product())).toBe(false);
  });

  it('rejects a product in excludeProducts even if otherwise eligible', () => {
    expect(productMatchesScope({ excludeProducts: ['prod1'] }, product())).toBe(false);
  });

  it('matches via ancestor-inclusive category scoping (parent category also matches child)', () => {
    // scope targets the PARENT category; product's own category is the child, but ancestors include the parent
    expect(productMatchesScope({ includeCategories: ['catJewellery'] }, product())).toBe(true);
    expect(productMatchesScope({ includeCategories: ['catRings'] }, product())).toBe(true);
    expect(productMatchesScope({ includeCategories: ['catNecklaces'] }, product())).toBe(false);
  });

  it('excludeCategories also checks ancestors', () => {
    expect(productMatchesScope({ excludeCategories: ['catJewellery'] }, product())).toBe(false);
  });

  it('matches direct collection assignment only, not RULE_BASED membership', () => {
    expect(productMatchesScope({ includeCollections: ['colWedding'] }, product())).toBe(true);
    expect(productMatchesScope({ includeCollections: ['colOther'] }, product())).toBe(false);
  });

  it('matches brand include/exclude', () => {
    expect(productMatchesScope({ includeBrands: ['brand1'] }, product())).toBe(true);
    expect(productMatchesScope({ excludeBrands: ['brand1'] }, product())).toBe(false);
  });

  it('matches metal/purity/gemstoneType (the jewellery-specific dimensions)', () => {
    expect(productMatchesScope({ metals: ['gold'] }, product())).toBe(true);
    expect(productMatchesScope({ metals: ['silver'] }, product())).toBe(false);
    expect(productMatchesScope({ purities: ['22K'] }, product())).toBe(true);
    expect(productMatchesScope({ purities: ['18K'] }, product())).toBe(false);
    expect(productMatchesScope({ gemstoneTypes: ['diamond'] }, product({ gemstoneType: 'diamond' }))).toBe(true);
    expect(productMatchesScope({ gemstoneTypes: ['diamond'] }, product())).toBe(false);
  });

  it('requires ALL dimensions to match simultaneously (AND across dimensions)', () => {
    const scope = { metals: ['gold'], includeCategories: ['catRings'] };
    expect(productMatchesScope(scope, product())).toBe(true);
    expect(productMatchesScope(scope, product({ metal: 'silver' }))).toBe(false);
    expect(productMatchesScope(scope, product({ category: 'catNecklaces', categoryAncestors: ['catJewellery'] }))).toBe(false);
  });

  it('matches OR within a single dimension (metals: [gold, silver])', () => {
    const scope = { metals: ['gold', 'silver'] };
    expect(productMatchesScope(scope, product({ metal: 'gold' }))).toBe(true);
    expect(productMatchesScope(scope, product({ metal: 'silver' }))).toBe(true);
    expect(productMatchesScope(scope, product({ metal: 'platinum' }))).toBe(false);
  });

  it('enforces minPrice/maxPrice range', () => {
    expect(productMatchesScope({ minPrice: 20000, maxPrice: 30000 }, product({ pricing: { finalPrice: 25000 } }))).toBe(true);
    expect(productMatchesScope({ minPrice: 30000 }, product({ pricing: { finalPrice: 25000 } }))).toBe(false);
    expect(productMatchesScope({ maxPrice: 20000 }, product({ pricing: { finalPrice: 25000 } }))).toBe(false);
  });

  it('excludes already-discounted products when excludeSaleProducts is set', () => {
    const onSale = product({ pricing: { finalPrice: 18000, mrp: 25000 } });
    const fullPrice = product({ pricing: { finalPrice: 25000, mrp: 25000 } });
    expect(productMatchesScope({ excludeSaleProducts: true }, onSale)).toBe(false);
    expect(productMatchesScope({ excludeSaleProducts: true }, fullPrice)).toBe(true);
  });
});

describe('promotionRules.service#hasEligibleItems', () => {
  it('returns true if at least one product in the list matches', () => {
    const scope = { metals: ['gold'] };
    expect(hasEligibleItems(scope, [product({ metal: 'silver' }), product({ metal: 'gold' })])).toBe(true);
  });

  it('returns false if no product matches', () => {
    const scope = { metals: ['platinum'] };
    expect(hasEligibleItems(scope, [product({ metal: 'gold' }), product({ metal: 'silver' })])).toBe(false);
  });
});
