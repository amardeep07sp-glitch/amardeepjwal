import { ApiError } from '../../utils/ApiError.js';
import { round2 } from '../product/pricing/priceCalculator.js';
import { couponRepository } from './coupon.repository.js';
import { COUPON_DISCOUNT_TYPES } from './coupon.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

function computeDiscount(coupon, subtotal) {
  const raw =
    coupon.discountType === COUPON_DISCOUNT_TYPES.PERCENTAGE ? (subtotal * coupon.discountValue) / 100 : coupon.discountValue;
  const capped = coupon.maxDiscountAmount != null ? Math.min(raw, coupon.maxDiscountAmount) : raw;
  return round2(Math.min(capped, subtotal));
}

export const couponService = {
  async listCoupons(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await couponRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getCouponById(id) {
    const coupon = await couponRepository.findById(id);
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    return coupon;
  },

  async createCoupon(data, userId) {
    if (data.validFrom >= data.validUntil) throw new ApiError(400, 'Valid Until must be after Valid From');
    const existing = await couponRepository.findByCode(data.code);
    if (existing) throw new ApiError(409, `Coupon code "${data.code.toUpperCase()}" already exists`);
    return couponRepository.create({ ...data, code: data.code.trim().toUpperCase(), createdBy: userId, updatedBy: userId });
  },

  async updateCoupon(id, data, userId) {
    const existing = await couponRepository.findById(id);
    if (!existing) throw new ApiError(404, 'Coupon not found');

    const validFrom = data.validFrom ?? existing.validFrom;
    const validUntil = data.validUntil ?? existing.validUntil;
    if (validFrom >= validUntil) throw new ApiError(400, 'Valid Until must be after Valid From');

    if (data.code) {
      const existing = await couponRepository.findByCode(data.code);
      if (existing && String(existing._id) !== String(id)) {
        throw new ApiError(409, `Coupon code "${data.code.toUpperCase()}" already exists`);
      }
    }

    const coupon = await couponRepository.updateById(id, {
      ...data,
      ...(data.code ? { code: data.code.trim().toUpperCase() } : {}),
      updatedBy: userId,
    });
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    return coupon;
  },

  async deleteCoupon(id) {
    const deleted = await couponRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Coupon not found');
  },

  // The one real gate every code goes through - both the cart page's
  // "Apply" preview AND the authoritative re-check inside checkout() call
  // this exact same function, so a code that passes preview can only ever
  // fail checkout if something genuinely changed in between (limit hit by
  // another order, coupon deactivated, window expired) - never because the
  // two paths compute discount differently.
  async validateForCustomer(code, customerId, subtotal) {
    const coupon = await couponRepository.findByCode(code);
    if (!coupon) throw new ApiError(404, 'Invalid coupon code');
    if (!coupon.isActive) throw new ApiError(400, 'This coupon is no longer active');

    const now = new Date();
    if (now < coupon.validFrom || now > coupon.validUntil) throw new ApiError(400, 'This coupon has expired or is not yet active');

    if (subtotal < coupon.minOrderValue) {
      throw new ApiError(400, `This coupon requires a minimum order value of ₹${coupon.minOrderValue}`);
    }

    if (coupon.usageLimit != null && coupon.redemptions.length >= coupon.usageLimit) {
      throw new ApiError(400, 'This coupon has reached its usage limit');
    }

    const customerRedemptions = coupon.redemptions.filter((r) => String(r.customer) === String(customerId));
    if (customerRedemptions.length >= coupon.usageLimitPerCustomer) {
      throw new ApiError(400, 'You have already used this coupon the maximum number of times');
    }

    const discountAmount = computeDiscount(coupon, subtotal);
    return { coupon, discountAmount };
  },

  async recordRedemption(couponId, customerId, orderId, discountAmount) {
    return couponRepository.pushRedemption(couponId, { customer: customerId, order: orderId, discountAmount });
  },
};
