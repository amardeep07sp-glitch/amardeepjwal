const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, email: ref.email };
  return ref.toString();
};

export const serializeActivityLog = (log) => {
  const plain = typeof log.toObject === 'function' ? log.toObject() : log;

  return {
    id: plain._id,
    module: plain.module,
    action: plain.action,
    entityId: plain.entityId,
    entityName: plain.entityName,
    performedBy: serializeUserRef(plain.performedBy),
    metadata: plain.metadata ?? {},
    createdAt: plain.createdAt,
  };
};

export const serializeActivityLogList = (logs) => logs.map(serializeActivityLog);
