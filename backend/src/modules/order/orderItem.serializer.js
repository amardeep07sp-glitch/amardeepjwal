const serializeRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

export const serializeOrderItem = (item) => {
  const plain = typeof item.toObject === 'function' ? item.toObject() : item;

  return {
    id: plain._id,
    order: plain.order?.toString?.() ?? plain.order,
    product: serializeRef(plain.product),
    variant: serializeRef(plain.variant),
    sku: plain.sku,
    barcode: plain.barcode?.toString?.() ?? plain.barcode,
    productSnapshot: plain.productSnapshot,
    variantSnapshot: plain.variantSnapshot,
    quantity: plain.quantity,
    unitPrice: plain.unitPrice,
    discount: plain.discount,
    tax: plain.tax,
    subtotal: plain.subtotal,
    total: plain.total,
    status: plain.status,
    createdAt: plain.createdAt,
  };
};

export const serializeOrderItemList = (items) => items.map(serializeOrderItem);
