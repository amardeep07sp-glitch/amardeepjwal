import { LOYALTY_TIER_THRESHOLDS } from './customer.constants.js';

// Pure - no DB, independently unit-testable (same convention as
// inventory.stockStatus.js#resolveStockStatus). Thresholds are checked
// highest-first since LOYALTY_TIER_THRESHOLDS is ordered Diamond -> Silver.
export function resolveLoyaltyTier(lifetimePointsEarned) {
  const match = LOYALTY_TIER_THRESHOLDS.find((row) => lifetimePointsEarned >= row.minPoints);
  return match?.tier ?? LOYALTY_TIER_THRESHOLDS[LOYALTY_TIER_THRESHOLDS.length - 1].tier;
}
