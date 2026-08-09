export const serializeAttributeGroup = (group) => {
  const plain = typeof group.toObject === 'function' ? group.toObject() : group;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    description: plain.description,
    order: plain.order,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeAttributeGroupList = (groups) => groups.map(serializeAttributeGroup);
