import { z } from 'zod';

export const DISCOUNT_TYPES = [
  { value: 'percentage', label: 'Percentage' },
  { value: 'fixed', label: 'Fixed' },
];

export const PRICE_STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'inactive', label: 'Inactive' },
];

export const pricingSchema = z
  .object({
    costPrice: z.coerce.number().min(0, 'Cost price cannot be negative'),
    sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative'),
    mrp: z.coerce.number().min(0, 'MRP cannot be negative'),
    discountType: z.enum(['percentage', 'fixed']).default('percentage'),
    discountValue: z.coerce.number().min(0, 'Discount cannot be negative').default(0),
    taxIncluded: z.boolean().default(false),
    taxPercentage: z.coerce.number().min(0, 'Tax cannot be negative').max(100, 'Tax cannot exceed 100%').default(0),
    currency: z.string().min(1, 'Currency is required').default('INR'),
    priceStatus: z.enum(['active', 'inactive']).default('active'),

    makingCharges: z.coerce.number().min(0).default(0),
    makingChargeType: z.enum(['percentage', 'fixed']).default('fixed'),
    wastagePercentage: z.coerce.number().min(0).default(0),
    goldRateSnapshot: z.coerce.number().min(0).default(0),
    silverRateSnapshot: z.coerce.number().min(0).default(0),
    stoneCost: z.coerce.number().min(0).default(0),
    diamondCost: z.coerce.number().min(0).default(0),
    labourCost: z.coerce.number().min(0).default(0),

    reason: z.string().optional(),
  })
  .refine((data) => data.sellingPrice >= data.costPrice, {
    message: 'Selling price must be greater than or equal to cost price',
    path: ['sellingPrice'],
  })
  .refine((data) => data.mrp >= data.sellingPrice, {
    message: 'MRP must be greater than or equal to selling price',
    path: ['mrp'],
  })
  .refine((data) => data.discountType !== 'percentage' || data.discountValue <= 100, {
    message: 'Percentage discount cannot exceed 100%',
    path: ['discountValue'],
  })
  .refine((data) => data.discountType !== 'fixed' || data.discountValue <= data.mrp, {
    message: 'Fixed discount cannot exceed MRP',
    path: ['discountValue'],
  });

export const pricingFormDefaults = {
  costPrice: 0,
  sellingPrice: 0,
  mrp: 0,
  discountType: 'percentage',
  discountValue: 0,
  taxIncluded: false,
  taxPercentage: 0,
  currency: 'INR',
  priceStatus: 'active',
  makingCharges: 0,
  makingChargeType: 'fixed',
  wastagePercentage: 0,
  goldRateSnapshot: 0,
  silverRateSnapshot: 0,
  stoneCost: 0,
  diamondCost: 0,
  labourCost: 0,
  reason: '',
};
