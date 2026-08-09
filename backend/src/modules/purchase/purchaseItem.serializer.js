const serializeRef = (ref, fields = ['name']) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  const shape = { id: ref._id.toString() };
  fields.forEach((f) => {
    shape[f] = ref[f];
  });
  return shape;
};

export const serializePurchaseItem = (item) => {
  const plain = typeof item.toObject === 'function' ? item.toObject() : item;
  return {
    id: plain._id,
    purchaseOrder: plain.purchaseOrder?.toString?.() ?? plain.purchaseOrder,
    product: serializeRef(plain.product, ['name', 'slug', 'sku']),
    variant: serializeRef(plain.variant, ['sku', 'slug']),
    sku: plain.sku,
    barcode: plain.barcode?.toString?.() ?? plain.barcode,
    productSnapshot: plain.productSnapshot,
    quantity: plain.quantity,
    receivedQuantity: plain.receivedQuantity,
    returnedQuantity: plain.returnedQuantity,
    pendingQuantity: plain.pendingQuantity,
    unitCost: plain.unitCost,
    discount: plain.discount,
    tax: plain.tax,
    total: plain.total,
  };
};

export const serializePurchaseItemList = (items) => items.map(serializePurchaseItem);
