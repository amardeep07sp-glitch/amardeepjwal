export const serializeTag = (tag) => {
  const plain = typeof tag.toObject === 'function' ? tag.toObject() : tag;
  return { id: plain._id, name: plain.name, color: plain.color, createdAt: plain.createdAt };
};

export const serializeTagList = (tags) => tags.map(serializeTag);
