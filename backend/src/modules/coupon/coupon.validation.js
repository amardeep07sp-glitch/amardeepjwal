import { z } from 'zod';
import { COUPON_DISCOUNT_TYPE_VALUES } from './coupon.constants.js';

// A query string's "false" is a non-empty string, so z.coerce.boolean()
// (which just does JS `Boolean(value)`) would treat it as truthy - same
// footgun already flagged in media.validation.js, fixed here the same way.
const booleanQueryParam = z.enum(['true', 'false']).optional().transform((value) => (value === undefined ? undefined : value === 'true'));

const couponBody = z.object({
  code: z.string().trim().min(3, 'Code must be at least 3 characters').max(20),
  description: z.string().trim().optional(),
  discountType: z.enum(COUPON_DISCOUNT_TYPE_VALUES),
  discountValue: z.coerce.number().positive('Discount value must be greater than 0'),
  maxDiscountAmount: z.coerce.number().positive().optional().nullable(),
  minOrderValue: z.coerce.number().min(0).optional(),
  usageLimit: z.coerce.number().int().positive().optional().nullable(),
  usageLimitPerCustomer: z.coerce.number().int().positive().optional(),
  validFrom: z.coerce.date(),
  validUntil: z.coerce.date(),
  isActive: z.boolean().optional(),
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
    isActive: booleanQueryParam,
  }),
});
