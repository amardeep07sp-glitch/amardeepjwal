const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

export const serializeActivityEntry = (entry) => {
  const plain = typeof entry.toObject === 'function' ? entry.toObject() : entry;

  return {
    id: plain._id,
    action: plain.action,
    oldValue: plain.oldValue,
    newValue: plain.newValue,
    reason: plain.reason,
    ipAddress: plain.ipAddress,
    userAgent: plain.userAgent,
    performedBy: serializeUserRef(plain.performedBy),
    createdAt: plain.createdAt,
  };
};

export const serializeActivityList = (entries) => entries.map(serializeActivityEntry);
