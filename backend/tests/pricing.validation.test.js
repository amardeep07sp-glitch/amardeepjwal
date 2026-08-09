import { updatePricingSchema } from '../src/modules/product/pricing/pricing.validation.js';

const basePricing = {
  costPrice: 500,
  sellingPrice: 800,
  mrp: 1000,
  discountType: 'percentage',
  discountValue: 10,
  taxIncluded: false,
  taxPercentage: 18,
  currency: 'INR',
  priceStatus: 'active',
  makingCharges: 0,
  makingChargeType: 'fixed',
  wastagePercentage: 0,
  goldRateSnapshot: 0,
  silverRateSnapshot: 0,
  stoneCost: 0,
  diamondCost: 0,
  labourCost: 0,
};

const validate = (overrides) =>
  updatePricingSchema.safeParse({ params: { id: 'p1' }, body: { ...basePricing, ...overrides } });

describe('pricing validation', () => {
  it('accepts a well-formed pricing payload', () => {
    expect(validate({}).success).toBe(true);
  });

  it('rejects selling price below cost price', () => {
    const result = validate({ costPrice: 900, sellingPrice: 800 });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('sellingPrice');
  });

  it('rejects MRP below selling price', () => {
    const result = validate({ sellingPrice: 900, mrp: 800 });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('mrp');
  });

  it('rejects a percentage discount over 100%', () => {
    const result = validate({ discountType: 'percentage', discountValue: 150 });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('discountValue');
  });

  it('rejects a fixed discount larger than MRP', () => {
    const result = validate({ discountType: 'fixed', discountValue: 5000, mrp: 1000, sellingPrice: 800 });
    expect(result.success).toBe(false);
    expect(result.error.issues[0].path).toContain('discountValue');
  });

  it('rejects negative values', () => {
    const result = validate({ costPrice: -10 });
    expect(result.success).toBe(false);
  });

  it('rejects a missing/empty currency', () => {
    const result = validate({ currency: '' });
    expect(result.success).toBe(false);
  });

  it('rejects tax percentage above 100', () => {
    const result = validate({ taxPercentage: 250 });
    expect(result.success).toBe(false);
  });
});
