import { STOCK_STATUSES } from './inventory.constants.js';

// Pure, DB-free decision logic (same convention as priceCalculator.js /
// variant.combination.js) - re-evaluated after every ledger movement.
//
// PRE_ORDER and DISCONTINUED are deliberate manual business decisions, not
// quantity-derived states - a movement should never silently flip a
// discontinued item back to "in stock". Only the automatic three
// (IN_STOCK/LOW_STOCK/OUT_OF_STOCK) are recomputed from quantity.
export function resolveStockStatus(currentStatus, { availableQuantity, minimumStock }) {
  if (currentStatus === STOCK_STATUSES.PRE_ORDER || currentStatus === STOCK_STATUSES.DISCONTINUED) {
    return currentStatus;
  }
  if (availableQuantity <= 0) return STOCK_STATUSES.OUT_OF_STOCK;
  if (availableQuantity <= minimumStock) return STOCK_STATUSES.LOW_STOCK;
  return STOCK_STATUSES.IN_STOCK;
}
