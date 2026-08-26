export const serializeBroadcast = (broadcast) => ({
  id: broadcast._id,
  title: broadcast.title,
  message: broadcast.message,
  channels: broadcast.channels,
  status: broadcast.status,
  stats: broadcast.stats,
  isActive: broadcast.isActive,
  expiresAt: broadcast.expiresAt,
  startedAt: broadcast.startedAt,
  completedAt: broadcast.completedAt,
  failureReason: broadcast.failureReason,
  createdBy: broadcast.createdBy
    ? { id: broadcast.createdBy._id, name: broadcast.createdBy.name, email: broadcast.createdBy.email }
    : null,
  createdAt: broadcast.createdAt,
  updatedAt: broadcast.updatedAt,
});

export const serializeBroadcastList = (broadcasts) => broadcasts.map(serializeBroadcast);

export const serializeWebsiteBroadcast = (broadcast) => ({
  id: broadcast._id,
  title: broadcast.title,
  message: broadcast.message,
  expiresAt: broadcast.expiresAt,
  createdAt: broadcast.createdAt,
});

export const serializeWebsiteBroadcastList = (broadcasts) => broadcasts.map(serializeWebsiteBroadcast);
