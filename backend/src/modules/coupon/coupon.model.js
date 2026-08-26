import mongoose from 'mongoose';
import {
  COUPON_DISCOUNT_TYPE_VALUES,
  DISCOUNT_BASE_VALUES,
  DISCOUNT_BASES,
  COUPON_ELIGIBILITY_VALUES,
  COUPON_ELIGIBILITY_TYPES,
  COUPON_STATUS_VALUES,
  COUPON_STATUSES,
} from './coupon.constants.js';
import { JEWELLERY_METALS, GEMSTONE_TYPES } from '../../constants/catalog.js';

// Every include/exclude array, if non-empty, narrows eligibility (AND
// across dimensions - a coupon with both `metals` and `includeCategories`
// set requires BOTH to match; OR within one dimension - metals: [gold,
// silver] matches either). An empty array on any single dimension means
// "no restriction from this dimension", not "matches nothing" - see
// promotionRules.service.js#productMatchesScope for the actual evaluator.
const couponScopeSchema = new mongoose.Schema(
  {
    includeProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    excludeProducts: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Product' }],
    includeCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    excludeCategories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
    includeCollections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    excludeCollections: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Collection' }],
    includeBrands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
    excludeBrands: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Brand' }],
    metals: [{ type: String, enum: Object.values(JEWELLERY_METALS) }],
    purities: [{ type: String, trim: true }],
    gemstoneTypes: [{ type: String, enum: Object.values(GEMSTONE_TYPES) }],
    minPrice: { type: Number, min: 0, default: null },
    maxPrice: { type: Number, min: 0, default: null },
    // A product is "on sale" per its own real pricing.discountType/Value -
    // never a guess. Default false (discounted items ARE included) matches
    // this system's pre-existing checkout behavior, so an untouched coupon
    // keeps working exactly as before.
    excludeSaleProducts: { type: Boolean, default: false },
  },
  { _id: false }
);

const couponEligibilitySchema = new mongoose.Schema(
  {
    type: { type: String, enum: COUPON_ELIGIBILITY_VALUES, default: COUPON_ELIGIBILITY_TYPES.ALL_CUSTOMERS },
    selectedCustomers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Customer' }],
  },
  { _id: false }
);

// Only meaningful when discountType = BUY_X_GET_Y. getDiscountPercentage
// of 100 means the Y units are free; anything less is a partial discount
// on them (e.g. "buy 2 get 1 at 50% off").
const buyXGetYSchema = new mongoose.Schema(
  {
    buyQuantity: { type: Number, min: 1, default: 1 },
    getQuantity: { type: Number, min: 1, default: 1 },
    getDiscountPercentage: { type: Number, min: 0, max: 100, default: 100 },
  },
  { _id: false }
);

const couponSchema = new mongoose.Schema(
  {
    campaignId: { type: mongoose.Schema.Types.ObjectId, ref: 'Campaign', default: null, index: true },
    code: { type: String, required: true, unique: true, trim: true, uppercase: true, index: true },
    description: { type: String, trim: true, default: '' },
    // A private coupon is never surfaced by the "available offers" listing
    // (section 24's own rule) - a customer can only apply it by already
    // knowing the code (a targeted email/SMS code, a VIP-only code, ...).
    isPrivate: { type: Boolean, default: false },
    status: { type: String, enum: COUPON_STATUS_VALUES, default: COUPON_STATUSES.DRAFT, index: true },

    discountType: { type: String, enum: COUPON_DISCOUNT_TYPE_VALUES, required: true },
    discountValue: { type: Number, required: true, min: 0 },
    // What discountValue is actually computed against - see
    // coupon.constants.js#DISCOUNT_BASES header comment. Defaults to the
    // pre-existing behavior (whole eligible subtotal).
    discountBase: { type: String, enum: DISCOUNT_BASE_VALUES, default: DISCOUNT_BASES.CART_SUBTOTAL },
    buyXGetY: { type: buyXGetYSchema, default: () => ({}) },

    // Caps a percentage discount's rupee value - ignored for fixed-amount
    // coupons (their own discountValue is already the cap).
    maxDiscountAmount: { type: Number, min: 0, default: null },
    minOrderValue: { type: Number, min: 0, default: 0 },
    maximumCartValue: { type: Number, min: 0, default: null },

    scope: { type: couponScopeSchema, default: () => ({}) },
    eligibility: { type: couponEligibilitySchema, default: () => ({}) },

    // null = unlimited. usageCount is the fast, atomically-incremented
    // counter every validation checks against (see
    // coupon.repository.js#incrementUsage) - the real, undeletable
    // per-redemption history lives in the separate CouponRedemption
    // collection (never counted via COUNT on every validation, that
    // collection is for history/analytics, not the hot gate).
    usageLimit: { type: Number, min: 1, default: null },
    usageLimitPerCustomer: { type: Number, min: 1, default: 1 },
    usageCount: { type: Number, min: 0, default: 0 },
    dailyUsageLimit: { type: Number, min: 1, default: null },

    // Default false = the existing "one promotional coupon per order" rule
    // this checkout already enforces (only one couponCode field on Order).
    // true additionally requires `stackGroup`/priority reasoning a future
    // multi-coupon checkout would use - stored now so that's additive, not
    // a breaking schema change later.
    stackable: { type: Boolean, default: false },
    priority: { type: Number, default: 0 },

    validFrom: { type: Date, required: true },
    validUntil: { type: Date, required: true },

    // What happens to THIS coupon's usage when an order that redeemed it
    // is cancelled/returned - see coupon.service.js#applyCancellationPolicy.
    cancellationPolicy: {
      type: String,
      enum: ['return_coupon', 'consume_coupon'],
      default: 'return_coupon',
    },

    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    updatedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
  },
  { timestamps: true }
);

couponSchema.index({ status: 1, validFrom: 1, validUntil: 1 });

export const Coupon = mongoose.model('Coupon', couponSchema);
