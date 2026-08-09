export const serializeSegment = (segment) => {
  const plain = typeof segment.toObject === 'function' ? segment.toObject() : segment;
  return {
    id: plain._id,
    name: plain.name,
    description: plain.description,
    color: plain.color,
    isSystemDefined: plain.isSystemDefined,
    createdAt: plain.createdAt,
  };
};

export const serializeSegmentList = (segments) => segments.map(serializeSegment);
