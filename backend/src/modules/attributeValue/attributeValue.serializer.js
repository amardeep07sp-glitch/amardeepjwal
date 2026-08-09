const serializeAttributeRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, slug: ref.slug, type: ref.type };
  return ref.toString();
};

export const serializeAttributeValue = (attributeValue) => {
  const plain = typeof attributeValue.toObject === 'function' ? attributeValue.toObject() : attributeValue;

  return {
    id: plain._id,
    attribute: serializeAttributeRef(plain.attribute),
    value: plain.value,
    hexColor: plain.hexColor,
    imageUrl: plain.imageUrl,
    order: plain.order,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeAttributeValueList = (values) => values.map(serializeAttributeValue);
