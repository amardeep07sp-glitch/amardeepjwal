export const BROADCAST_CHANNELS = Object.freeze({
  EMAIL: 'email',
  WHATSAPP: 'whatsapp',
  WEBSITE: 'website',
});
export const BROADCAST_CHANNEL_VALUES = Object.values(BROADCAST_CHANNELS);

export const BROADCAST_STATUSES = Object.freeze({
  PENDING: 'pending',
  SENDING: 'sending',
  COMPLETED: 'completed',
  FAILED: 'failed',
});
export const BROADCAST_STATUS_VALUES = Object.values(BROADCAST_STATUSES);
