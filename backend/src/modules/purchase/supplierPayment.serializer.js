const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

export const serializeSupplierPayment = (payment) => {
  const plain = typeof payment.toObject === 'function' ? payment.toObject() : payment;
  return {
    id: plain._id,
    supplier: plain.supplier?.toString?.() ?? plain.supplier,
    purchaseOrder: plain.purchaseOrder?.toString?.() ?? plain.purchaseOrder,
    method: plain.method,
    amount: plain.amount,
    status: plain.status,
    transactionReference: plain.transactionReference,
    paidAt: plain.paidAt,
    recordedBy: serializeUserRef(plain.recordedBy),
    createdAt: plain.createdAt,
  };
};

export const serializeSupplierPaymentList = (payments) => payments.map(serializeSupplierPayment);
