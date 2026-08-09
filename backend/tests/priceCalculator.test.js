import { calculateDiscountAmount, calculatePricePreview } from '../src/modules/product/pricing/priceCalculator.js';

describe('calculateDiscountAmount', () => {
  it('computes a percentage discount', () => {
    expect(calculateDiscountAmount({ mrp: 1000, discountType: 'percentage', discountValue: 10 })).toBe(100);
  });

  it('computes a fixed discount', () => {
    expect(calculateDiscountAmount({ mrp: 1000, discountType: 'fixed', discountValue: 150 })).toBe(150);
  });

  it('clamps a fixed discount that exceeds MRP', () => {
    expect(calculateDiscountAmount({ mrp: 500, discountType: 'fixed', discountValue: 800 })).toBe(500);
  });

  it('clamps a percentage discount above 100%', () => {
    expect(calculateDiscountAmount({ mrp: 1000, discountType: 'percentage', discountValue: 150 })).toBe(1000);
  });
});

describe('calculatePricePreview', () => {
  it('applies a percentage discount with no tax', () => {
    const result = calculatePricePreview({
      mrp: 1000,
      discountType: 'percentage',
      discountValue: 10,
      taxIncluded: false,
      taxPercentage: 0,
    });

    expect(result).toEqual({
      mrp: 1000,
      discountAmount: 100,
      priceAfterDiscount: 900,
      taxAmount: 0,
      finalPrice: 900,
      savings: 100,
    });
  });

  it('adds tax on top when tax is not included in MRP', () => {
    const result = calculatePricePreview({
      mrp: 1000,
      discountType: 'fixed',
      discountValue: 0,
      taxIncluded: false,
      taxPercentage: 18,
    });

    expect(result.taxAmount).toBe(180);
    expect(result.finalPrice).toBe(1180);
    // Zero discount + tax added on top can legitimately push the final price
    // above MRP, meaning "savings" goes negative - this is correct, not a bug.
    expect(result.savings).toBe(-180);
  });

  it('extracts the tax portion when tax is already included in MRP', () => {
    const result = calculatePricePreview({
      mrp: 1180,
      discountType: 'fixed',
      discountValue: 0,
      taxIncluded: true,
      taxPercentage: 18,
    });

    expect(result.taxAmount).toBe(180);
    expect(result.finalPrice).toBe(1180);
    expect(result.savings).toBe(0);
  });

  it('combines a percentage discount with tax-included pricing', () => {
    const result = calculatePricePreview({
      mrp: 1000,
      discountType: 'percentage',
      discountValue: 10,
      taxIncluded: true,
      taxPercentage: 18,
    });

    expect(result.discountAmount).toBe(100);
    expect(result.priceAfterDiscount).toBe(900);
    expect(result.taxAmount).toBe(137.29);
    expect(result.finalPrice).toBe(900);
    expect(result.savings).toBe(100);
  });

  it('never lets a discount push the price after discount below zero', () => {
    const result = calculatePricePreview({
      mrp: 200,
      discountType: 'fixed',
      discountValue: 5000,
      taxIncluded: false,
      taxPercentage: 0,
    });

    expect(result.priceAfterDiscount).toBe(0);
    expect(result.finalPrice).toBe(0);
  });
});
