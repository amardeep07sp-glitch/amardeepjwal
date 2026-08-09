const serializeOrderRef = (ref) => {
  if (!ref) return null;
  if (ref.orderNumber !== undefined) return { id: ref._id.toString(), orderNumber: ref.orderNumber };
  return ref.toString();
};

export const serializeOrderReturn = (orderReturn) => {
  const plain = typeof orderReturn.toObject === 'function' ? orderReturn.toObject() : orderReturn;

  return {
    id: plain._id,
    order: serializeOrderRef(plain.order),
    items: (plain.items ?? []).map((i) => ({
      orderItem: i.orderItem?.toString?.() ?? i.orderItem,
      returnQuantity: i.returnQuantity,
    })),
    reason: plain.reason,
    status: plain.status,
    requestedBy: plain.requestedBy?.toString?.() ?? plain.requestedBy,
    approvedBy: plain.approvedBy?.toString?.() ?? plain.approvedBy,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeOrderReturnList = (returns) => returns.map(serializeOrderReturn);
