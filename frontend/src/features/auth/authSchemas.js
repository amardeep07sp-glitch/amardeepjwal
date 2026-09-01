import { z } from 'zod';

export const loginSchema = z.object({
  identifier: z.string().min(3, 'Enter your email or phone number'),
  password: z.string().min(1, 'Password is required'),
});
