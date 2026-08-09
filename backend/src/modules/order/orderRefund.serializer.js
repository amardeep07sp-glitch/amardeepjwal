const serializeOrderRef = (ref) => {
  if (!ref) return null;
  if (ref.orderNumber !== undefined) return { id: ref._id.toString(), orderNumber: ref.orderNumber };
  return ref.toString();
};

export const serializeOrderRefund = (refund) => {
  const plain = typeof refund.toObject === 'function' ? refund.toObject() : refund;

  return {
    id: plain._id,
    order: serializeOrderRef(plain.order),
    return: plain.return?.toString?.() ?? plain.return,
    type: plain.type,
    amount: plain.amount,
    method: plain.method,
    status: plain.status,
    refundReference: plain.refundReference,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeOrderRefundList = (refunds) => refunds.map(serializeOrderRefund);
