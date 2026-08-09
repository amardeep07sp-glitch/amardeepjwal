const serializeRef = (ref, fields = ['name']) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  const shape = { id: ref._id.toString() };
  fields.forEach((f) => {
    shape[f] = ref[f];
  });
  return shape;
};

const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

export const serializePurchaseReturn = (purchaseReturn) => {
  const plain = typeof purchaseReturn.toObject === 'function' ? purchaseReturn.toObject() : purchaseReturn;
  return {
    id: plain._id,
    returnNumber: plain.returnNumber,
    purchaseOrder: serializeRef(plain.purchaseOrder, ['poNumber']),
    supplier: serializeRef(plain.supplier, ['name', 'supplierCode']),
    items: (plain.items ?? []).map((line) => ({
      purchaseItem: line.purchaseItem?.toString?.() ?? line.purchaseItem,
      quantity: line.quantity,
    })),
    reason: plain.reason,
    action: plain.action,
    status: plain.status,
    amount: plain.amount,
    requestedBy: serializeUserRef(plain.requestedBy),
    approvedBy: serializeUserRef(plain.approvedBy),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializePurchaseReturnList = (returns) => returns.map(serializePurchaseReturn);
