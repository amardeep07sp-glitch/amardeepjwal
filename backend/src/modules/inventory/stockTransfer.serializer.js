const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

const serializeWarehouseRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, code: ref.code };
  return ref.toString();
};

const serializeInventoryRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  const product = ref.product?.name !== undefined ? { id: ref.product._id.toString(), name: ref.product.name, sku: ref.product.sku } : ref.product;
  return { id: ref._id.toString(), sku: ref.sku, product };
};

export const serializeStockTransfer = (transfer) => {
  const plain = typeof transfer.toObject === 'function' ? transfer.toObject() : transfer;

  return {
    id: plain._id,
    inventory: serializeInventoryRef(plain.inventory),
    fromWarehouse: serializeWarehouseRef(plain.fromWarehouse),
    toWarehouse: serializeWarehouseRef(plain.toWarehouse),
    quantity: plain.quantity,
    status: plain.status,
    requestedBy: serializeUserRef(plain.requestedBy),
    approvedBy: serializeUserRef(plain.approvedBy),
    completedAt: plain.completedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeStockTransferList = (transfers) => transfers.map(serializeStockTransfer);
