const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

export const serializeTimelineEntry = (entry) => {
  const plain = typeof entry.toObject === 'function' ? entry.toObject() : entry;

  return {
    id: plain._id,
    event: plain.event,
    note: plain.note,
    createdBy: serializeUserRef(plain.createdBy),
    createdAt: plain.createdAt,
  };
};

export const serializeTimelineList = (entries) => entries.map(serializeTimelineEntry);
