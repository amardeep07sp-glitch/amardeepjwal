import { resolveStockStatus } from '../src/modules/inventory/inventory.stockStatus.js';

describe('resolveStockStatus', () => {
  it('returns OUT_OF_STOCK when available quantity is zero or negative', () => {
    expect(resolveStockStatus('in_stock', { availableQuantity: 0, minimumStock: 5 })).toBe('out_of_stock');
  });

  it('returns LOW_STOCK when available quantity is at or below the minimum', () => {
    expect(resolveStockStatus('in_stock', { availableQuantity: 5, minimumStock: 5 })).toBe('low_stock');
  });

  it('returns IN_STOCK when available quantity is above the minimum', () => {
    expect(resolveStockStatus('low_stock', { availableQuantity: 10, minimumStock: 5 })).toBe('in_stock');
  });

  it('never overrides PRE_ORDER regardless of quantity', () => {
    expect(resolveStockStatus('pre_order', { availableQuantity: 0, minimumStock: 5 })).toBe('pre_order');
  });

  it('never overrides DISCONTINUED regardless of quantity', () => {
    expect(resolveStockStatus('discontinued', { availableQuantity: 999, minimumStock: 5 })).toBe('discontinued');
  });
});
