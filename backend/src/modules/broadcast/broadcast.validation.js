import { z } from 'zod';
import { BROADCAST_CHANNEL_VALUES } from './broadcast.constants.js';

const broadcastBody = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  message: z.string().trim().min(1, 'Message is required').max(2000),
  channels: z.array(z.enum(BROADCAST_CHANNEL_VALUES)).min(1, 'Select at least one channel'),
  expiresAt: z.coerce.date().optional().nullable(),
});

export const createBroadcastSchema = z.object({ body: broadcastBody });

export const broadcastIdSchema = z.object({ params: z.object({ id: z.string() }) });

export const listBroadcastsQuerySchema = z.object({
  query: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().positive().max(100).default(20),
  }),
});
