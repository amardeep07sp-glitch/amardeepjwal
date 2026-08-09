import { PRICE_ADJUSTMENT_TYPES } from './pricing.schema.js';

// Exported (not just file-private) so other modules needing the exact same
// 2-decimal rounding behavior (e.g. order.service.js's line-item math) reuse
// this instead of re-implementing it.
export const round2 = (value) => Math.round((value + Number.EPSILON) * 100) / 100;

// Single source of truth for how a discount reduces MRP. Changing discount
// business rules means changing this function only - nothing else in the
// codebase should re-implement this math.
export function calculateDiscountAmount({ mrp, discountType, discountValue }) {
  if (discountType === PRICE_ADJUSTMENT_TYPES.PERCENTAGE) {
    return round2(Math.min(mrp * (discountValue / 100), mrp));
  }
  return round2(Math.min(discountValue, mrp));
}

// The full price breakdown: MRP -> discount -> tax -> final price -> savings.
// This is what both the "Price Preview" and "Discount Calculator" UI display,
// and it's what pricing.service.js persists as the authoritative finalPrice.
export function calculatePricePreview({ mrp, discountType, discountValue, taxIncluded, taxPercentage }) {
  const discountAmount = calculateDiscountAmount({ mrp, discountType, discountValue });
  const priceAfterDiscount = round2(Math.max(mrp - discountAmount, 0));

  let taxAmount;
  let finalPrice;

  if (taxIncluded) {
    // Tax is already baked into priceAfterDiscount - back it out for display.
    taxAmount = round2(priceAfterDiscount - priceAfterDiscount / (1 + taxPercentage / 100));
    finalPrice = priceAfterDiscount;
  } else {
    taxAmount = round2(priceAfterDiscount * (taxPercentage / 100));
    finalPrice = round2(priceAfterDiscount + taxAmount);
  }

  const savings = round2(mrp - finalPrice);

  return {
    mrp: round2(mrp),
    discountAmount,
    priceAfterDiscount,
    taxAmount,
    finalPrice,
    savings,
  };
}
