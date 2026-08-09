const serializeInventoryRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  const product = ref.product?.name !== undefined ? { id: ref.product._id.toString(), name: ref.product.name, sku: ref.product.sku } : ref.product;
  const warehouse = ref.warehouse?.name !== undefined ? { id: ref.warehouse._id.toString(), name: ref.warehouse.name, code: ref.warehouse.code } : ref.warehouse;
  return { id: ref._id.toString(), sku: ref.sku, product, warehouse };
};

export const serializeAlert = (alert) => {
  const plain = typeof alert.toObject === 'function' ? alert.toObject() : alert;

  return {
    id: plain._id,
    inventory: serializeInventoryRef(plain.inventory),
    type: plain.type,
    message: plain.message,
    status: plain.status,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeAlertList = (alerts) => alerts.map(serializeAlert);
