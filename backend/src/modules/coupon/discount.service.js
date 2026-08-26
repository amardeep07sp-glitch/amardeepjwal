import { DISCOUNT_BASES, COUPON_DISCOUNT_TYPES } from './coupon.constants.js';
import { round2 } from '../product/pricing/priceCalculator.js';

// What discountValue is actually computed against - see
// coupon.constants.js#DISCOUNT_BASES. `eligibleItems` is already
// scope-filtered (promotionRules.service.js) before this ever runs.
function computeBaseAmount(discountBase, eligibleItems, cartContext) {
  switch (discountBase) {
    case DISCOUNT_BASES.MAKING_CHARGES:
      return round2(eligibleItems.reduce((sum, item) => sum + (item.makingChargePerUnit ?? 0) * item.quantity, 0));
    case DISCOUNT_BASES.SHIPPING:
      return round2(cartContext.shippingCharge ?? 0);
    case DISCOUNT_BASES.PRODUCT_PRICE:
    case DISCOUNT_BASES.CART_SUBTOTAL:
    default:
      return round2(eligibleItems.reduce((sum, item) => sum + item.total, 0));
  }
}

// Pools all eligible units together (flattened by quantity) and discounts
// the globally CHEAPEST qualifying units first - conservative for the
// business (a "buy 2 get 1" promotion never accidentally gives away the
// most expensive item in the group). Only whole `buyQuantity + getQuantity`
// groups count; leftover units below a full group get no discount.
function calculateBuyXGetY({ buyQuantity = 1, getQuantity = 1, getDiscountPercentage = 100 } = {}, eligibleItems) {
  const groupSize = buyQuantity + getQuantity;
  if (groupSize <= 0) return 0;

  const units = eligibleItems.flatMap((item) => Array.from({ length: item.quantity }, () => item.unitPrice)).sort((a, b) => a - b);
  const fullGroups = Math.floor(units.length / groupSize);
  if (fullGroups === 0) return 0;

  let discount = 0;
  for (let g = 0; g < fullGroups; g += 1) {
    const groupStart = g * groupSize;
    for (let i = 0; i < getQuantity; i += 1) {
      discount += units[groupStart + i] * (getDiscountPercentage / 100);
    }
  }
  return discount;
}

// `eligibleItems`: [{ productId, quantity, unitPrice, total, makingChargePerUnit }]
// `cartContext`: { shippingCharge }
// Returns { discountAmount, baseAmount } - both already rounded to paise.
// Never returns a negative or NaN discount; callers still cap the FINAL
// discount at the order's own grand total elsewhere (a discount can never
// exceed what's actually being charged).
export function calculateDiscount(coupon, eligibleItems, cartContext = {}) {
  const baseAmount = computeBaseAmount(coupon.discountBase, eligibleItems, cartContext);

  if (coupon.discountType === COUPON_DISCOUNT_TYPES.BUY_X_GET_Y) {
    const discountAmount = round2(Math.max(0, calculateBuyXGetY(coupon.buyXGetY, eligibleItems)));
    return { discountAmount, baseAmount };
  }

  if (baseAmount <= 0) return { discountAmount: 0, baseAmount: 0 };

  let discountAmount = 0;
  if (coupon.discountType === COUPON_DISCOUNT_TYPES.PERCENTAGE) {
    discountAmount = round2((baseAmount * coupon.discountValue) / 100);
    if (coupon.maxDiscountAmount != null) discountAmount = Math.min(discountAmount, coupon.maxDiscountAmount);
  } else if (coupon.discountType === COUPON_DISCOUNT_TYPES.FIXED_AMOUNT) {
    discountAmount = Math.min(coupon.discountValue, baseAmount);
  } else if (coupon.discountType === COUPON_DISCOUNT_TYPES.FREE_SHIPPING) {
    discountAmount = cartContext.shippingCharge ?? 0;
  }

  return { discountAmount: round2(Math.max(0, discountAmount)), baseAmount };
}
