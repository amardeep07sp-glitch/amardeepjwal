import { z } from 'zod';

const contactBody = z.object({
  name: z.string().min(1, 'Name is required'),
  designation: z.string().optional(),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  phone: z.string().optional(),
  isPrimary: z.boolean().optional(),
});

export const createContactSchema = z.object({ params: z.object({ supplierId: z.string() }), body: contactBody });
export const updateContactSchema = z.object({ params: z.object({ id: z.string() }), body: contactBody.partial() });
export const contactIdSchema = z.object({ params: z.object({ id: z.string() }) });
export const supplierIdParamSchema = z.object({ params: z.object({ supplierId: z.string() }) });
