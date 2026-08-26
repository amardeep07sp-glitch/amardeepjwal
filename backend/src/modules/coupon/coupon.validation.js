import { z } from 'zod';
import {
  COUPON_DISCOUNT_TYPE_VALUES,
  DISCOUNT_BASE_VALUES,
  COUPON_ELIGIBILITY_VALUES,
  COUPON_STATUS_VALUES,
} from './coupon.constants.js';
import { JEWELLERY_METALS, GEMSTONE_TYPES } from '../../constants/catalog.js';

const objectId = z.string().min(1);

const couponScopeBody = z.object({
  includeProducts: z.array(objectId).optional(),
  excludeProducts: z.array(objectId).optional(),
  includeCategories: z.array(objectId).optional(),
  excludeCategories: z.array(objectId).optional(),
  includeCollections: z.array(objectId).optional(),
  excludeCollections: z.array(objectId).optional(),
  includeBrands: z.array(objectId).optional(),
  excludeBrands: z.array(objectId).optional(),
  metals: z.array(z.enum(Object.values(JEWELLERY_METALS))).optional(),
  purities: z.array(z.string()).optional(),
  gemstoneTypes: z.array(z.enum(Object.values(GEMSTONE_TYPES))).optional(),
  minPrice: z.coerce.number().min(0).optional().nullable(),
  maxPrice: z.coerce.number().min(0).optional().nullable(),
  excludeSaleProducts: z.boolean().optional(),
});

const couponEligibilityBody = z.object({
  type: z.enum(COUPON_ELIGIBILITY_VALUES).optional(),
  selectedCustomers: z.array(objectId).optional(),
});

const buyXGetYBody = z.object({
  buyQuantity: z.coerce.number().int().positive().optional(),
  getQuantity: z.coerce.number().int().positive().optional(),
  getDiscountPercentage: z.coerce.number().min(0).max(100).optional(),
});

const couponBody = z.object({
  campaignId: objectId.optional().nullable(),
  code: z.string().trim().min(3, 'Code must be at least 3 characters').max(20),
  description: z.string().trim().optional(),
  isPrivate: z.boolean().optional(),
  status: z.enum(COUPON_STATUS_VALUES).optional(),

  discountType: z.enum(COUPON_DISCOUNT_TYPE_VALUES),
  discountValue: z.coerce.number().min(0),
  discountBase: z.enum(DISCOUNT_BASE_VALUES).optional(),
  buyXGetY: buyXGetYBody.optional(),
  maxDiscountAmount: z.coerce.number().positive().optional().nullable(),
  minOrderValue: z.coerce.number().min(0).optional(),
  maximumCartValue: z.coerce.number().positive().optional().nullable(),

  scope: couponScopeBody.optional(),
  eligibility: couponEligibilityBody.optional(),

  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  usageLimitPerCustomer: z.coerce.number().int().positive().optional(),
  dailyUsageLimit: z.coerce.number().int().positive().optional().nullable(),

  stackable: z.boolean().optional(),
  priority: z.coerce.number().optional(),

  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  cancellationPolicy: z.enum(['return_coupon', 'consume_coupon']).optional(),
});

export const createCouponSchema = z.object({ body: couponBody });

export const updateCouponSchema = z.object({
  params: z.object({ id: z.string() }),
  body: couponBody.partial(),
});

export const couponIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listCouponsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    search: z.string().trim().optional(),
    status: z.enum(COUPON_STATUS_VALUES).optional(),
    campaignId: objectId.optional(),
  }),
});

export const listRedemptionsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
    couponId: objectId.optional(),
    campaignId: objectId.optional(),
    customerId: objectId.optional(),
    status: z.enum(['redeemed', 'cancelled', 'refunded']).optional(),
  }),
});
