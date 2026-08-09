import { z } from 'zod';
import { PRICE_ADJUSTMENT_TYPES, PRICE_STATUSES } from './pricing.schema.js';

const pricingBody = z
  .object({
    costPrice: z.number().min(0, 'Cost price cannot be negative'),
    sellingPrice: z.number().min(0, 'Selling price cannot be negative'),
    mrp: z.number().min(0, 'MRP cannot be negative'),
    discountType: z.enum(Object.values(PRICE_ADJUSTMENT_TYPES)).default(PRICE_ADJUSTMENT_TYPES.PERCENTAGE),
    discountValue: z.number().min(0, 'Discount cannot be negative').default(0),
    taxIncluded: z.boolean().default(false),
    taxPercentage: z.number().min(0, 'Tax cannot be negative').max(100, 'Tax cannot exceed 100%').default(0),
    currency: z.string().min(1, 'Currency is required').default('INR'),
    priceStatus: z.enum(Object.values(PRICE_STATUSES)).default(PRICE_STATUSES.ACTIVE),

    makingCharges: z.number().min(0, 'Making charges cannot be negative').default(0),
    makingChargeType: z.enum(Object.values(PRICE_ADJUSTMENT_TYPES)).default(PRICE_ADJUSTMENT_TYPES.FIXED),
    wastagePercentage: z.number().min(0, 'Wastage cannot be negative').default(0),
    goldRateSnapshot: z.number().min(0, 'Gold rate cannot be negative').default(0),
    silverRateSnapshot: z.number().min(0, 'Silver rate cannot be negative').default(0),
    stoneCost: z.number().min(0, 'Stone cost cannot be negative').default(0),
    diamondCost: z.number().min(0, 'Diamond cost cannot be negative').default(0),
    labourCost: z.number().min(0, 'Labour cost cannot be negative').default(0),

    // Not persisted on the pricing subdocument - consumed by the service to
    // annotate the resulting PriceHistory entry.
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
  .refine((data) => data.discountType !== PRICE_ADJUSTMENT_TYPES.PERCENTAGE || data.discountValue <= 100, {
    message: 'Percentage discount cannot exceed 100%',
    path: ['discountValue'],
  })
  .refine((data) => data.discountType !== PRICE_ADJUSTMENT_TYPES.FIXED || data.discountValue <= data.mrp, {
    message: 'Fixed discount cannot exceed MRP',
    path: ['discountValue'],
  });

export const updatePricingSchema = z.object({
  params: z.object({ id: z.string() }),
  body: pricingBody,
});

export const pricingHistoryQuerySchema = z.object({
  params: z.object({ id: z.string() }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(10),
  }),
});
