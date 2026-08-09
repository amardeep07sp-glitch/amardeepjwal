const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

const serializeInventoryRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  const product = ref.product?.name !== undefined ? { id: ref.product._id.toString(), name: ref.product.name, sku: ref.product.sku } : ref.product;
  const warehouse = ref.warehouse?.name !== undefined ? { id: ref.warehouse._id.toString(), name: ref.warehouse.name, code: ref.warehouse.code } : ref.warehouse;
  return { id: ref._id.toString(), sku: ref.sku, product, warehouse };
};

export const serializeStockAudit = (audit) => {
  const plain = typeof audit.toObject === 'function' ? audit.toObject() : audit;

  return {
    id: plain._id,
    inventory: serializeInventoryRef(plain.inventory),
    countedQuantity: plain.countedQuantity,
    systemQuantity: plain.systemQuantity,
    difference: plain.difference,
    status: plain.status,
    performedBy: serializeUserRef(plain.performedBy),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeStockAuditList = (audits) => audits.map(serializeStockAudit);
