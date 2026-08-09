import { z } from 'zod';

export const COUPON_DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'flat', label: 'Flat Amount' },
];

export const STATUS_BADGE_VARIANTS = {
  active: 'success',
  inactive: 'secondary',
};

// z.coerce.number() on an intentionally-empty optional field ("" ->
// unlimited usage) would coerce to 0 and fail `.positive()` - preprocess
// blank strings/undefined to undefined first so "leave it empty" actually
// means "no limit", matching the backend's own null = unlimited semantics.
const optionalPositiveNumber = z.preprocess(
  (val) => (val === '' || val === undefined || val === null ? undefined : Number(val)),
  z.number().positive().optional()
);

export const couponSchema = z
  .object({
    code: z
      .string()
      .trim()
      .min(3, 'Code must be at least 3 characters')
      .max(20, 'Code must be at most 20 characters')
      .regex(/^[A-Za-z0-9]+$/, 'Letters and numbers only'),
    description: z.string().trim().optional(),
    discountType: z.enum(['percentage', 'flat']),
    discountValue: z.coerce.number().positive('Discount value must be greater than 0'),
    maxDiscountAmount: optionalPositiveNumber,
    minOrderValue: z.coerce.number().min(0).optional(),
    usageLimit: optionalPositiveNumber,
    usageLimitPerCustomer: z.coerce.number().int().positive().optional(),
    validFrom: z.string().min(1, 'Valid From is required'),
    validUntil: z.string().min(1, 'Valid Until is required'),
    isActive: z.boolean().default(true),
  })
  .refine((data) => new Date(data.validFrom) < new Date(data.validUntil), {
    message: 'Valid Until must be after Valid From',
    path: ['validUntil'],
  });

export const couponFormDefaults = {
  code: '',
  description: '',
  discountType: 'percentage',
  discountValue: '',
  maxDiscountAmount: '',
  minOrderValue: '',
  usageLimit: '',
  usageLimitPerCustomer: 1,
  validFrom: '',
  validUntil: '',
  isActive: true,
};
