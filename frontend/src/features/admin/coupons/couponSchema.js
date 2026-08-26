import { z } from 'zod';

// Must match backend/src/modules/coupon/coupon.constants.js exactly.
// FIXED_PRICE and METAL_VALUE/STONE_VALUE discount bases are a deliberate,
// documented backend v2 follow-up (OrderItem doesn't persist a metal/stone
// cost split today) - not offered here either.
export const COUPON_DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed_amount', label: 'Fixed Amount' },
  { value: 'free_shipping', label: 'Free Shipping' },
  { value: 'buy_x_get_y', label: 'Buy X Get Y' },
];

export const DISCOUNT_BASES = [
  { value: 'cart_subtotal', label: 'Cart Subtotal', description: 'The full eligible cart value' },
  { value: 'product_price', label: 'Product Price', description: 'Same as cart subtotal for the eligible items' },
  { value: 'making_charges', label: 'Making Charges Only', description: '"50% off Making Charges" never means 50% off everything' },
  { value: 'shipping', label: 'Shipping Charge', description: 'Only meaningful for Free Shipping coupons' },
];

export const COUPON_ELIGIBILITY_TYPES = [
  { value: 'all_customers', label: 'All customers' },
  { value: 'new_customers', label: 'New customers (0 real orders)' },
  { value: 'first_order', label: 'First order only' },
  { value: 'existing_customers', label: 'Existing customers (1+ real orders)' },
  { value: 'vip_customers', label: 'VIP (Gold+ loyalty tier)' },
  { value: 'selected_customers', label: 'Selected customers only' },
];

// Only DRAFT/ACTIVE/PAUSED/ARCHIVED are ever manually set - SCHEDULED/
// EXPIRED/EXHAUSTED are always computed server-side from real
// validFrom/validUntil/usageCount data.
export const COUPON_MANUAL_STATUSES = [
  { value: 'draft', label: 'Draft' },
  { value: 'active', label: 'Active' },
  { value: 'paused', label: 'Paused' },
  { value: 'archived', label: 'Archived' },
];

export const COUPON_EFFECTIVE_STATUS_VARIANTS = {
  draft: 'secondary',
  scheduled: 'info',
  active: 'success',
  paused: 'warning',
  expired: 'secondary',
  exhausted: 'warning',
  archived: 'secondary',
};

export const CANCELLATION_POLICIES = [
  { value: 'return_coupon', label: 'Return the coupon use (default)', description: 'A cancelled/refunded order gives the customer their use back' },
  { value: 'consume_coupon', label: 'Keep the coupon consumed', description: 'A cancelled/refunded order does NOT give the use back' },
];

const optionalPositiveNumber = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().positive().optional()
);

// scope/eligibility/buyXGetY are intentionally NOT deep-validated here -
// CouponScopeBuilder/CouponEligibilityBuilder own their own shapes (which
// differ slightly from the wire format - products/customers carry
// {id, label} pairs in form state), and the backend's own zod schema
// (coupon.validation.js) is the real, authoritative validator regardless
// of what this form sends - this schema exists for UX hints, not security.
export const couponSchema = z
  .object({
    campaignId: z.string(),
    code: z
      .string()
      .trim()
      .min(3, 'Code must be at least 3 characters')
      .max(20, 'Code must be at most 20 characters')
      .regex(/^[A-Za-z0-9]+$/, 'Letters and numbers only'),
    description: z.string().trim().optional(),
    isPrivate: z.boolean().default(false),
    status: z.enum(COUPON_MANUAL_STATUSES.map((s) => s.value)),

    discountType: z.enum(COUPON_DISCOUNT_TYPES.map((t) => t.value)),
    discountValue: z.coerce.number().min(0),
    discountBase: z.enum(DISCOUNT_BASES.map((b) => b.value)),
    buyXGetY: z.object({
      buyQuantity: z.coerce.number().int().positive(),
      getQuantity: z.coerce.number().int().positive(),
      getDiscountPercentage: z.coerce.number().min(0).max(100),
    }),
    maxDiscountAmount: optionalPositiveNumber,
    minOrderValue: z.coerce.number().min(0).optional(),
    maximumCartValue: optionalPositiveNumber,

    scope: z.any(),
    eligibility: z.any(),

    usageLimit: optionalPositiveNumber,
    usageLimitPerCustomer: z.coerce.number().int().positive().optional(),
    dailyUsageLimit: optionalPositiveNumber,

    stackable: z.boolean().default(false),
    priority: z.coerce.number().optional(),

    validFrom: z.string().min(1, 'Valid From is required'),
    validUntil: z.string().min(1, 'Valid Until is required'),
    cancellationPolicy: z.enum(['return_coupon', 'consume_coupon']),
  })
  .refine((data) => new Date(data.validFrom) < new Date(data.validUntil), {
    message: 'Valid Until must be after Valid From',
    path: ['validUntil'],
  });

const emptyScope = {
  includeProducts: [],
  excludeProducts: [],
  includeCategories: [],
  excludeCategories: [],
  includeCollections: [],
  excludeCollections: [],
  includeBrands: [],
  excludeBrands: [],
  metals: [],
  purities: [],
  gemstoneTypes: [],
  minPrice: null,
  maxPrice: null,
  excludeSaleProducts: false,
};

const emptyEligibility = { type: 'all_customers', selectedCustomers: [] };

export const couponFormDefaults = {
  campaignId: 'none',
  code: '',
  description: '',
  isPrivate: false,
  status: 'draft',
  discountType: 'percentage',
  discountValue: '',
  discountBase: 'cart_subtotal',
  buyXGetY: { buyQuantity: 1, getQuantity: 1, getDiscountPercentage: 100 },
  maxDiscountAmount: '',
  minOrderValue: '',
  maximumCartValue: '',
  scope: emptyScope,
  eligibility: emptyEligibility,
  usageLimit: '',
  usageLimitPerCustomer: 1,
  dailyUsageLimit: '',
  stackable: false,
  priority: 0,
  validFrom: '',
  validUntil: '',
  cancellationPolicy: 'return_coupon',
};
