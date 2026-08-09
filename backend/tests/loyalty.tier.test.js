import { describe, it, expect } from '@jest/globals';
import { resolveLoyaltyTier } from '../src/modules/customer/loyalty.tier.js';

describe('loyalty.tier#resolveLoyaltyTier', () => {
  it('returns silver for zero or low lifetime points', () => {
    expect(resolveLoyaltyTier(0)).toBe('silver');
    expect(resolveLoyaltyTier(4999)).toBe('silver');
  });

  it('returns gold at the gold threshold', () => {
    expect(resolveLoyaltyTier(5000)).toBe('gold');
    expect(resolveLoyaltyTier(9999)).toBe('gold');
  });

  it('returns platinum at the platinum threshold', () => {
    expect(resolveLoyaltyTier(10000)).toBe('platinum');
    expect(resolveLoyaltyTier(19999)).toBe('platinum');
  });

  it('returns diamond at the diamond threshold and above', () => {
    expect(resolveLoyaltyTier(20000)).toBe('diamond');
    expect(resolveLoyaltyTier(1000000)).toBe('diamond');
  });
});
