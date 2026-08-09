import { z } from 'zod';
import { CUSTOMER_STATUSES, CUSTOMER_TYPES, LEAD_SOURCES, GENDERS } from './customer.constants.js';

const customerBody = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().optional(),
  displayName: z.string().optional(),
  email: z.union([z.string().email('Invalid email address'), z.literal('')]).optional(),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional().nullable(),
  anniversary: z.string().optional().nullable(),
  gender: z.enum(Object.values(GENDERS)).optional(),
  avatarMedia: z.string().optional().nullable(),
  status: z.enum(Object.values(CUSTOMER_STATUSES)).optional(),
  leadSource: z.enum(Object.values(LEAD_SOURCES)).optional(),
  customerType: z.enum(Object.values(CUSTOMER_TYPES)).optional(),
  gstNumber: z.string().optional(),
  companyName: z.string().optional(),
  preferredLanguage: z.string().optional(),
  preferredCurrency: z.string().optional(),
  preferredStore: z.string().optional().nullable(),
  referredByCode: z.string().optional(),
});

export const createCustomerSchema = z.object({ body: customerBody });
export const updateCustomerSchema = z.object({ params: z.object({ id: z.string() }), body: customerBody.partial() });
export const customerIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listCustomersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
    status: z.enum(Object.values(CUSTOMER_STATUSES)).optional(),
    customerType: z.enum(Object.values(CUSTOMER_TYPES)).optional(),
    segment: z.string().optional(),
    tag: z.string().optional(),
    dateFrom: z.string().optional(),
    dateTo: z.string().optional(),
    search: z.string().optional(),
    sortBy: z.enum(['createdAt', 'firstName', 'customerCode']).default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).default('desc'),
  }),
});

export const bulkStatusSchema = z.object({
  body: z.object({
    ids: z.array(z.string()).min(1, 'Select at least one customer'),
    status: z.enum(Object.values(CUSTOMER_STATUSES)),
  }),
});

export const tagAssignSchema = z.object({
  params: z.object({ id: z.string(), tagId: z.string() }),
});

export const segmentAssignSchema = z.object({
  params: z.object({ id: z.string(), segmentId: z.string() }),
});
