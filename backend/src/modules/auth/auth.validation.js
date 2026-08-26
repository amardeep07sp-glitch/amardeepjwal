import { z } from 'zod';
import { ROLE_VALUES } from '../../constants/roles.js';

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

export const registerSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    phone: z.string().optional(),
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
