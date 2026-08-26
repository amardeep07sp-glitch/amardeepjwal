import mongoose from 'mongoose';
import { ApiError } from '../../utils/ApiError.js';
import { couponRepository } from './coupon.repository.js';
import { couponRedemptionRepository } from './couponRedemption.repository.js';
import { campaignRepository } from '../campaign/campaign.repository.js';
import { computeEffectiveStatus as computeCampaignEffectiveStatus } from '../campaign/campaign.service.js';
import { productRepository } from '../product/product.repository.js';
import { categoryRepository } from '../category/category.repository.js';
import { productMatchesScope } from './promotionRules.service.js';
import { calculateDiscount } from './discount.service.js';
import { checkCustomerEligibility } from './eligibility.service.js';
import { COUPON_STATUSES } from './coupon.constants.js';
import { REDEMPTION_STATUSES } from './couponRedemption.model.js';
import { round2 } from '../product/pricing/priceCalculator.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

// Manual states win; EXPIRED/EXHAUSTED are always derived fresh from real
// validUntil/usageLimit data (same discipline as Campaign's own
// computeEffectiveStatus - never trust a stored "active" flag that could
// have silently gone stale).
export function computeEffectiveStatus(coupon) {
  if ([COUPON_STATUSES.DRAFT, COUPON_STATUSES.PAUSED, COUPON_STATUSES.ARCHIVED].includes(coupon.status)) return coupon.status;
  const now = new Date();
  if (coupon.usageLimit != null && coupon.usageCount >= coupon.usageLimit) return COUPON_STATUSES.EXHAUSTED;
  if (now < coupon.validFrom) return COUPON_STATUSES.SCHEDULED;
  if (now > coupon.validUntil) return COUPON_STATUSES.EXPIRED;
  return COUPON_STATUSES.ACTIVE;
}

// Batches product + category-ancestor resolution for a cart's worth of
// items in two queries total (never N+1) - the real data
// promotionRules.service.js#productMatchesScope needs to evaluate scope
// rules per item.
async function resolveScopeContext(cartItems) {
  const productIds = [...new Set(cartItems.map((item) => String(item.productId)))];
  const products = await productRepository.findRawByIds(productIds);
  const productById = new Map(products.map((p) => [String(p._id), p]));

  const categoryIds = [...new Set(products.map((p) => String(p.category)).filter(Boolean))];
  const categories = categoryIds.length ? await categoryRepository.findByIds(categoryIds) : [];
  const ancestorsByCategory = new Map(categories.map((c) => [String(c._id), (c.ancestors ?? []).map(String)]));

  return cartItems.map((item) => {
    const product = productById.get(String(item.productId));
    return {
      ...item,
      _id: item.productId,
      category: product?.category ?? null,
      categoryAncestors: product?.category ? (ancestorsByCategory.get(String(product.category)) ?? []) : [],
      brand: product?.brand ?? null,
      collectionId: product?.collectionId ?? null,
      metal: product?.metal ?? null,
      purity: product?.purity ?? '',
      gemstoneType: product?.gemstoneType ?? 'none',
      pricing: product?.pricing ?? {},
      makingChargePerUnit: product?.pricing?.makingCharges ?? 0,
    };
  });
}

const startOfToday = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

export const couponService = {
  computeEffectiveStatus,

  async listCoupons(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await couponRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },

  async getCouponById(id) {
    const coupon = await couponRepository.findByIdPopulated(id);
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
      const codeMatch = await couponRepository.findByCode(data.code);
      if (codeMatch && String(codeMatch._id) !== String(id)) {
        throw new ApiError(409, `Coupon code "${data.code.toUpperCase()}" already exists`);
      }
    }

    const coupon = await couponRepository.updateById(id, { ...data, ...(data.code ? { code: data.code.trim().toUpperCase() } : {}), updatedBy: userId });
    if (!coupon) throw new ApiError(404, 'Coupon not found');
    return coupon;
  },

  async deleteCoupon(id) {
    const deleted = await couponRepository.deleteById(id);
    if (!deleted) throw new ApiError(404, 'Coupon not found');
  },

  // The one real gate every code goes through - both the cart page's
  // "Apply" preview AND the authoritative re-check inside checkout() call
  // this exact same function with the exact same real cart data, so a
  // code that passes preview can only ever fail checkout if something
  // genuinely changed in between (limit hit by another order, coupon
  // paused, price changed) - never because the two paths evaluate
  // differently. `cartItems`: [{ productId, variantId, quantity, unitPrice, total }].
  // `cartContext`: { subtotal, shippingCharge }.
  async validateForCustomer(code, customerId, cartItems, cartContext) {
    const coupon = await couponRepository.findByCode(code);
    if (!coupon) throw new ApiError(404, 'Invalid coupon code');

    const effectiveStatus = computeEffectiveStatus(coupon);
    if (effectiveStatus !== COUPON_STATUSES.ACTIVE) {
      const messages = {
        [COUPON_STATUSES.SCHEDULED]: 'This coupon is not active yet.',
        [COUPON_STATUSES.EXPIRED]: 'This coupon has expired.',
        [COUPON_STATUSES.EXHAUSTED]: 'This coupon has reached its usage limit.',
        [COUPON_STATUSES.PAUSED]: 'This coupon is currently paused.',
        [COUPON_STATUSES.DRAFT]: 'This coupon is not active yet.',
        [COUPON_STATUSES.ARCHIVED]: 'This coupon is no longer available.',
      };
      throw new ApiError(400, messages[effectiveStatus] ?? 'This coupon is not currently valid.');
    }

    if (coupon.campaignId) {
      const campaign = await campaignRepository.findById(coupon.campaignId);
      if (campaign && computeCampaignEffectiveStatus(campaign) !== 'active') {
        throw new ApiError(400, 'This offer is no longer running.');
      }
    }

    const eligibility = await checkCustomerEligibility(coupon.eligibility, customerId);
    if (!eligibility.eligible) throw new ApiError(400, eligibility.reason ?? 'You are not eligible for this coupon.');

    const customerUsageCount = await couponRedemptionRepository.countByCustomerAndCoupon(customerId, coupon._id);
    if (customerUsageCount >= coupon.usageLimitPerCustomer) {
      throw new ApiError(400, 'You have already used this coupon the maximum number of times.');
    }

    if (coupon.dailyUsageLimit != null) {
      const todayUsageCount = await couponRedemptionRepository.countByCouponSince(coupon._id, startOfToday());
      if (todayUsageCount >= coupon.dailyUsageLimit) {
        throw new ApiError(400, 'This coupon has reached its usage limit for today.');
      }
    }

    if (cartContext.subtotal < coupon.minOrderValue) {
      throw new ApiError(400, `This coupon requires a minimum order value of ₹${coupon.minOrderValue}.`);
    }
    if (coupon.maximumCartValue != null && cartContext.subtotal > coupon.maximumCartValue) {
      throw new ApiError(400, `This coupon is only valid for orders up to ₹${coupon.maximumCartValue}.`);
    }

    const resolvedItems = await resolveScopeContext(cartItems);
    const eligibleItems = resolvedItems.filter((item) => productMatchesScope(coupon.scope, item));
    if (eligibleItems.length === 0) {
      throw new ApiError(400, 'None of the items in your cart are eligible for this coupon.');
    }

    const { discountAmount, baseAmount } = calculateDiscount(coupon, eligibleItems, cartContext);
    if (discountAmount <= 0) {
      throw new ApiError(400, 'This coupon does not apply any discount to your current cart.');
    }

    const eligibleSubtotal = round2(eligibleItems.reduce((sum, item) => sum + item.total, 0));
    return { coupon, discountAmount, eligibleSubtotal, baseAmount, eligibleItems };
  },

  // Records a real, permanent redemption - atomic usage increment first
  // (fails closed if the limit was hit by a concurrent request between
  // validation and this call), then the ledger row, then the campaign
  // budget spend. Called only after the order itself is already confirmed
  // (storefront.service.js#checkout) - never speculatively.
  async recordRedemption(couponId, customerId, orderId, discountAmount, discountBase) {
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
      const updated = await couponRepository.incrementUsage(couponId, session);
      if (!updated) {
        throw new ApiError(409, 'This coupon just reached its usage limit - please remove it and try again.');
      }

      const redemption = await couponRedemptionRepository.create(
        {
          couponId,
          campaignId: updated.campaignId ?? null,
          customerId,
          orderId,
          code: updated.code,
          discountAmount,
          discountBase,
          status: REDEMPTION_STATUSES.REDEEMED,
        },
        session
      );

      if (updated.campaignId) {
        await campaignRepository.incrementSpentBudget(updated.campaignId, discountAmount, session);
      }

      await session.commitTransaction();
      return redemption;
    } catch (err) {
      await session.abortTransaction();
      throw err;
    } finally {
      session.endSession();
    }
  },

  // Cancellation/refund hook (sections 35-36) - looks up this order's real
  // redemption row(s) and, per the coupon's own configured policy, gives
  // the usage back (decrements the atomic counter + campaign spend) or
  // leaves it consumed. The ledger row itself is NEVER deleted, only
  // status-transitioned - the historical fact "this code was used on this
  // order" must remain queryable forever.
  async releaseRedemptionForOrder(orderId, { refund = false } = {}) {
    const redemptions = await couponRedemptionRepository.findByOrder(orderId);
    for (const redemption of redemptions) {
      if (redemption.status !== REDEMPTION_STATUSES.REDEEMED) continue; // eslint-disable-line no-continue
      // eslint-disable-next-line no-await-in-loop
      const coupon = await couponRepository.findById(redemption.couponId);
      const shouldReturn = coupon?.cancellationPolicy !== 'consume_coupon';

      if (shouldReturn) {
        // eslint-disable-next-line no-await-in-loop
        await couponRepository.decrementUsage(redemption.couponId);
        if (redemption.campaignId) {
          // eslint-disable-next-line no-await-in-loop
          await campaignRepository.decrementSpentBudget(redemption.campaignId, redemption.discountAmount);
        }
      }

      // eslint-disable-next-line no-await-in-loop
      if (refund) await couponRedemptionRepository.markRefunded(orderId);
      else await couponRedemptionRepository.markCancelled(orderId); // eslint-disable-line no-await-in-loop
    }
  },
};
