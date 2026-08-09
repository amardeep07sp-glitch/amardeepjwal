const serializeRef = (ref, fields = ['name']) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  const shape = { id: ref._id.toString() };
  fields.forEach((f) => {
    shape[f] = ref[f];
  });
  return shape;
};

export const serializePurchaseOrder = (purchaseOrder) => {
  const plain = typeof purchaseOrder.toObject === 'function' ? purchaseOrder.toObject() : purchaseOrder;
  return {
    id: plain._id,
    poNumber: plain.poNumber,
    supplier: serializeRef(plain.supplier, ['name', 'supplierCode', 'email', 'phone', 'gstNumber']),
    supplierSnapshot: plain.supplierSnapshot,
    warehouse: serializeRef(plain.warehouse, ['name', 'code']),
    subtotal: plain.subtotal,
    discount: plain.discount,
    tax: plain.tax,
    shippingCharge: plain.shippingCharge,
    grandTotal: plain.grandTotal,
    expectedDeliveryDate: plain.expectedDeliveryDate,
    internalNotes: plain.internalNotes,
    status: plain.status,
    paymentStatus: plain.paymentStatus,
    createdBy: serializeRef(plain.createdBy, ['name']),
    updatedBy: serializeRef(plain.updatedBy, ['name']),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializePurchaseOrderList = (purchaseOrders) => purchaseOrders.map(serializePurchaseOrder);
