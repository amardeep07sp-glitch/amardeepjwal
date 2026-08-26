import { computeEffectiveStatus } from './coupon.service.js';

// Handles both shapes the same field can arrive in: a raw ObjectId (list
// queries, which never populate) or a populated subdocument (the admin
// edit-fetch's findByIdPopulated). Can't discriminate on `ref._id` - every
// Mongoose ObjectId has an `_id` getter that returns itself, so that check
// is always truthy whether populated or not. Checking for the expected
// label field instead (same pattern product.serializer.js's own
// serializeRef already uses) is the real signal: only a populated
// subdocument actually has a `name`/`displayName`.
const serializeRef = (ref, labelField = 'name') => {
  if (ref == null) return null;
  if (typeof ref === 'object' && ref[labelField] !== undefined) {
    return { id: ref._id.toString(), name: ref[labelField], ...(ref.sku ? { sku: ref.sku } : {}) };
  }
  return ref.toString();
};
const serializeRefList = (refs, labelField = 'name') => (refs ?? []).map((r) => serializeRef(r, labelField));

const serializeScope = (scope) => {
  if (!scope) return scope;
  return {
    ...scope,
    includeProducts: serializeRefList(scope.includeProducts),
    excludeProducts: serializeRefList(scope.excludeProducts),
    includeCategories: serializeRefList(scope.includeCategories),
    excludeCategories: serializeRefList(scope.excludeCategories),
    includeCollections: serializeRefList(scope.includeCollections),
    excludeCollections: serializeRefList(scope.excludeCollections),
    includeBrands: serializeRefList(scope.includeBrands),
    excludeBrands: serializeRefList(scope.excludeBrands),
  };
};

const serializeEligibility = (eligibility) => {
  if (!eligibility) return eligibility;
  return { ...eligibility, selectedCustomers: serializeRefList(eligibility.selectedCustomers, 'displayName') };
};

export const serializeCoupon = (coupon) => {
  const plain = typeof coupon.toObject === 'function' ? coupon.toObject() : coupon;

  return {
    id: plain._id,
    campaignId: serializeRef(plain.campaignId),
    code: plain.code,
    description: plain.description,
    isPrivate: plain.isPrivate,
    status: plain.status,
    effectiveStatus: computeEffectiveStatus(plain),

    discountType: plain.discountType,
    discountValue: plain.discountValue,
    discountBase: plain.discountBase,
    buyXGetY: plain.buyXGetY,
    maxDiscountAmount: plain.maxDiscountAmount,
    minOrderValue: plain.minOrderValue,
    maximumCartValue: plain.maximumCartValue,

    scope: serializeScope(plain.scope),
    eligibility: serializeEligibility(plain.eligibility),

    usageLimit: plain.usageLimit,
    usageLimitPerCustomer: plain.usageLimitPerCustomer,
    usageCount: plain.usageCount,
    dailyUsageLimit: plain.dailyUsageLimit,

    stackable: plain.stackable,
    priority: plain.priority,

    validFrom: plain.validFrom,
    validUntil: plain.validUntil,
    cancellationPolicy: plain.cancellationPolicy,

    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeCouponList = (coupons) => coupons.map(serializeCoupon);

export const serializeCouponPreview = ({ coupon, discountAmount, eligibleSubtotal, baseAmount }) => ({
  code: coupon.code,
  description: coupon.description,
  discountAmount,
  eligibleSubtotal,
  baseAmount,
  discountBase: coupon.discountBase,
});
