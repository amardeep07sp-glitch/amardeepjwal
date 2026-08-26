import { z } from 'zod';

export const BROADCAST_CHANNELS = [
  { value: 'email', label: 'Email' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'website', label: 'Website banner' },
];

export const BROADCAST_STATUS_VARIANTS = {
  pending: 'secondary',
  sending: 'default',
  completed: 'success',
  failed: 'destructive',
};

export const broadcastSchema = z.object({
  title: z.string().trim().min(1, 'Title is required').max(150),
  message: z.string().trim().min(1, 'Message is required').max(2000),
  channels: z.array(z.enum(['email', 'whatsapp', 'website'])).min(1, 'Select at least one channel'),
  expiresAt: z.string().optional(),
});

export const broadcastFormDefaults = {
  title: '',
  message: '',
  channels: ['email', 'whatsapp'],
  expiresAt: '',
};
