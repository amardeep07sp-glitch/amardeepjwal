const serializeGroupRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, slug: ref.slug };
  return ref.toString();
};

export const serializeAttribute = (attribute) => {
  const plain = typeof attribute.toObject === 'function' ? attribute.toObject() : attribute;

  return {
    id: plain._id,
    name: plain.name,
    slug: plain.slug,
    group: serializeGroupRef(plain.group),
    type: plain.type,
    isRequired: plain.isRequired,
    isFilterable: plain.isFilterable,
    order: plain.order,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeAttributeList = (attributes) => attributes.map(serializeAttribute);
