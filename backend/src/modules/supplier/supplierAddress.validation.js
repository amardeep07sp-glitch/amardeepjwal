import { z } from 'zod';
import { SUPPLIER_ADDRESS_TYPES } from './supplier.constants.js';

const addressBody = z.object({
  type: z.enum(Object.values(SUPPLIER_ADDRESS_TYPES)).optional(),
  label: z.string().optional(),
  line1: z.string().min(1, 'Address line 1 is required'),
  line2: z.string().optional(),
  city: z.string().min(1, 'City is required'),
  state: z.string().min(1, 'State is required'),
  postalCode: z.string().min(1, 'Postal code is required'),
  country: z.string().optional(),
  phone: z.string().optional(),
  isDefault: z.boolean().optional(),
});

export const createAddressSchema = z.object({ params: z.object({ supplierId: z.string() }), body: addressBody });
export const updateAddressSchema = z.object({ params: z.object({ id: z.string() }), body: addressBody.partial() });
export const addressIdSchema = z.object({ params: z.object({ id: z.string() }) });
export const supplierIdParamSchema = z.object({ params: z.object({ supplierId: z.string() }) });
