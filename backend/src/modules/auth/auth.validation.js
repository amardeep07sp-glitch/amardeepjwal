import { z } from 'zod';
import { ROLE_VALUES, STAFF_ROLES } from '../../constants/roles.js';

export const listStaffUsersQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(50),
    search: z.string().trim().optional(),
    // Required (not optional) - an omitted filter would otherwise list
    // every user in the system including customers, not just staff.
    // Comma-separated in the URL (`?role=staff,manager`) rather than
    // repeated-key (`?role=a&role=b`) - simpler for the admin `api.js`
    // client, which doesn't special-case array query params.
    role: z
      .string()
      .transform((val) => val.split(','))
      .pipe(z.array(z.enum(ROLE_VALUES)).min(1)),
  }),
});

// Real Indian 10-digit mobile format (starts 6-9) - same shape the
// storefront's own support/contact phone numbers already follow.
const phoneSchema = z.string().trim().regex(/^[6-9]\d{9}$/, 'Enter a valid 10-digit mobile number');

export const startRegistrationSchema = z.object({
  body: z.object({
    phone: phoneSchema,
    email: z.string().trim().email('Invalid email address'),
  }),
});

export const resendRegistrationOtpSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
  }),
});

export const completeRegistrationSchema = z.object({
  body: z.object({
    email: z.string().trim().email('Invalid email address'),
    otp: z.string().trim().regex(/^\d{6}$/, 'Enter the 6-digit code'),
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

export const loginSchema = z.object({
  body: z.object({
    identifier: z.string().min(3, 'Enter your email or phone number'),
    password: z.string().min(1, 'Password is required'),
  }),
});

export const forgotPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Enter a valid email address'),
  }),
});

export const googleLoginSchema = z.object({
  body: z.object({
    idToken: z.string().min(10, 'Google ID token is required'),
  }),
});

export const resetPasswordSchema = z.object({
  body: z.object({
    email: z.string().email('Enter a valid email address'),
    token: z.string().min(1, 'Reset token is required'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  }),
});

// Admin-provisioned staff account (Super Admin only - see auth.routes.js) -
// distinct from completeRegistrationSchema above, which is the customer
// storefront's own OTP-verified self-signup. No OTP here: the Super Admin
// creating the account is itself the verification.
export const createStaffSchema = z.object({
  body: z.object({
    name: z.string().trim().min(2, 'Name must be at least 2 characters'),
    email: z.string().trim().email('Invalid email address'),
    phone: phoneSchema.optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    role: z.enum(STAFF_ROLES, { errorMap: () => ({ message: 'Select a valid staff role' }) }),
  }),
});

export const updateStaffSchema = z.object({
  params: z.object({ id: z.string() }),
  body: z.object({
    role: z.enum(STAFF_ROLES).optional(),
    isActive: z.boolean().optional(),
  }),
});
