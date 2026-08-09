import { z } from 'zod';

export const listNotificationsQuerySchema = z.object({
  params: z.object({ customerId: z.string() }),
  query: z.object({
    page: z.coerce.number().min(1).default(1),
    limit: z.coerce.number().min(1).max(100).default(20),
  }),
});

export const sendNotificationSchema = z.object({
  params: z.object({ customerId: z.string() }),
  body: z.object({
    subject: z.string().min(1, 'Subject is required'),
    message: z.string().min(1, 'Message is required'),
  }),
});
