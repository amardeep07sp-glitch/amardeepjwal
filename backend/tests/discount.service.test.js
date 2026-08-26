import { calculateDiscount } from '../src/modules/coupon/discount.service.js';
import { COUPON_DISCOUNT_TYPES, DISCOUNT_BASES } from '../src/modules/coupon/coupon.constants.js';

const item = (overrides = {}) => ({
  productId: 'p1',
  quantity: 1,
  unitPrice: 10000,
  total: 10000,
  makingChargePerUnit: 500,
  ...overrides,
});

describe('discount.service#calculateDiscount', () => {
  describe('percentage', () => {
    it('computes a percentage of the cart_subtotal base', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.PERCENTAGE, discountValue: 25, discountBase: DISCOUNT_BASES.CART_SUBTOTAL, maxDiscountAmount: null };
      const { discountAmount, baseAmount } = calculateDiscount(coupon, [item({ total: 20000 })]);
      expect(baseAmount).toBe(20000);
      expect(discountAmount).toBe(5000);
    });

    it('caps the discount at maxDiscountAmount (Diwali-style capped coupon)', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.PERCENTAGE, discountValue: 25, discountBase: DISCOUNT_BASES.CART_SUBTOTAL, maxDiscountAmount: 5000 };
      const { discountAmount, baseAmount } = calculateDiscount(coupon, [item({ total: 30000 })]);
      expect(baseAmount).toBe(30000);
      expect(discountAmount).toBe(5000); // 25% of 30000 = 7500, capped at 5000
    });

    it('computes against making_charges only, never the full item price', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.PERCENTAGE, discountValue: 50, discountBase: DISCOUNT_BASES.MAKING_CHARGES, maxDiscountAmount: null };
      const items = [item({ total: 20000, makingChargePerUnit: 1000, quantity: 2 })];
      const { discountAmount, baseAmount } = calculateDiscount(coupon, items);
      expect(baseAmount).toBe(2000); // 1000 * 2 units
      expect(discountAmount).toBe(1000); // 50% of 2000, NOT 50% of 20000
    });

    it('returns zero discount when the eligible base is zero', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.PERCENTAGE, discountValue: 50, discountBase: DISCOUNT_BASES.MAKING_CHARGES, maxDiscountAmount: null };
      const { discountAmount, baseAmount } = calculateDiscount(coupon, [item({ makingChargePerUnit: 0 })]);
      expect(baseAmount).toBe(0);
      expect(discountAmount).toBe(0);
    });
  });

  describe('fixed_amount', () => {
    it('never discounts more than the eligible base', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.FIXED_AMOUNT, discountValue: 5000, discountBase: DISCOUNT_BASES.CART_SUBTOTAL };
      const { discountAmount } = calculateDiscount(coupon, [item({ total: 3000 })]);
      expect(discountAmount).toBe(3000);
    });

    it('applies the full fixed amount when the base is larger', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.FIXED_AMOUNT, discountValue: 500, discountBase: DISCOUNT_BASES.CART_SUBTOTAL };
      const { discountAmount } = calculateDiscount(coupon, [item({ total: 10000 })]);
      expect(discountAmount).toBe(500);
    });
  });

  describe('free_shipping', () => {
    it('discounts exactly the cart shipping charge', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.FREE_SHIPPING, discountValue: 0, discountBase: DISCOUNT_BASES.SHIPPING };
      const { discountAmount } = calculateDiscount(coupon, [item()], { shippingCharge: 199 });
      expect(discountAmount).toBe(199);
    });

    it('discounts zero when there was no shipping charge', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.FREE_SHIPPING, discountValue: 0, discountBase: DISCOUNT_BASES.SHIPPING };
      const { discountAmount } = calculateDiscount(coupon, [item()], {});
      expect(discountAmount).toBe(0);
    });
  });

  describe('buy_x_get_y', () => {
    it('discounts the cheapest qualifying unit(s) first, one full group', () => {
      // buy 2 get 1 free -> group size 3
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.BUY_X_GET_Y, buyXGetY: { buyQuantity: 2, getQuantity: 1, getDiscountPercentage: 100 } };
      const items = [item({ productId: 'a', quantity: 1, unitPrice: 30000, total: 30000 }), item({ productId: 'b', quantity: 1, unitPrice: 10000, total: 10000 }), item({ productId: 'c', quantity: 1, unitPrice: 20000, total: 20000 })];
      const { discountAmount } = calculateDiscount(coupon, items);
      expect(discountAmount).toBe(10000); // cheapest unit (10000) is free
    });

    it('gives no discount for a partial group below buyQuantity+getQuantity', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.BUY_X_GET_Y, buyXGetY: { buyQuantity: 2, getQuantity: 1, getDiscountPercentage: 100 } };
      const items = [item({ quantity: 2, unitPrice: 10000, total: 20000 })]; // only 2 units, group needs 3
      const { discountAmount } = calculateDiscount(coupon, items);
      expect(discountAmount).toBe(0);
    });

    it('applies a partial getDiscountPercentage (buy 2 get 1 at 50% off)', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.BUY_X_GET_Y, buyXGetY: { buyQuantity: 2, getQuantity: 1, getDiscountPercentage: 50 } };
      const items = [item({ quantity: 3, unitPrice: 10000, total: 30000 })];
      const { discountAmount } = calculateDiscount(coupon, items);
      expect(discountAmount).toBe(5000); // 50% off the one cheapest (all equal) unit
    });

    it('discounts multiple full groups across pooled units', () => {
      const coupon = { discountType: COUPON_DISCOUNT_TYPES.BUY_X_GET_Y, buyXGetY: { buyQuantity: 1, getQuantity: 1, getDiscountPercentage: 100 } };
      const items = [item({ quantity: 4, unitPrice: 10000, total: 40000 })]; // 2 full groups of 2
      const { discountAmount } = calculateDiscount(coupon, items);
      expect(discountAmount).toBe(20000); // 2 free units
    });
  });
});
