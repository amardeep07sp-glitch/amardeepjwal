export const serializeCoupon = (coupon) => {
  const plain = typeof coupon.toObject === 'function' ? coupon.toObject() : coupon;

  return {
    id: plain._id,
    code: plain.code,
    description: plain.description,
    discountType: plain.discountType,
    discountValue: plain.discountValue,
    maxDiscountAmount: plain.maxDiscountAmount,
    minOrderValue: plain.minOrderValue,
    usageLimit: plain.usageLimit,
    usageLimitPerCustomer: plain.usageLimitPerCustomer,
    validFrom: plain.validFrom,
    validUntil: plain.validUntil,
    isActive: plain.isActive,
    redemptionCount: plain.redemptions?.length ?? 0,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeCouponList = (coupons) => coupons.map(serializeCoupon);

export const serializeCouponPreview = ({ coupon, discountAmount }) => ({
  code: coupon.code,
  description: coupon.description,
  discountAmount,
});
