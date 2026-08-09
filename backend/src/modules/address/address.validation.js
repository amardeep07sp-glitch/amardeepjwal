import { z } from 'zod';
import { ADDRESS_TYPES } from '../customer/customer.constants.js';

const addressBody = z.object({
  customer: z.string().min(1, 'Customer is required'),
  type: z.enum(Object.values(ADDRESS_TYPES)).optional(),
  label: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().optional(),
  phone: z.string().optional(),
  isDefaultBilling: z.boolean().optional(),
  isDefaultShipping: z.boolean().optional(),
});

export const createAddressSchema = z.object({ body: addressBody });

export const updateAddressSchema = z.object({
  params: z.object({ id: z.string() }),
  body: addressBody.partial().omit({ customer: true }),
});

export const addressIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const customerIdParamSchema = z.object({ params: z.object({ customerId: z.string() }) });
