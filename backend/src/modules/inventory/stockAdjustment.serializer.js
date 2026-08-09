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

export const serializeStockAdjustment = (adjustment) => {
  const plain = typeof adjustment.toObject === 'function' ? adjustment.toObject() : adjustment;

  return {
    id: plain._id,
    inventory: serializeInventoryRef(plain.inventory),
    type: plain.type,
    quantity: plain.quantity,
    reason: plain.reason,
    status: plain.status,
    requestedBy: serializeUserRef(plain.requestedBy),
    approvedBy: serializeUserRef(plain.approvedBy),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeStockAdjustmentList = (adjustments) => adjustments.map(serializeStockAdjustment);
