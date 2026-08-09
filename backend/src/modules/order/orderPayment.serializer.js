export const serializeOrderPayment = (payment) => {
  const plain = typeof payment.toObject === 'function' ? payment.toObject() : payment;

  return {
    id: plain._id,
    order: plain.order?.toString?.() ?? plain.order,
    method: plain.method,
    amount: plain.amount,
    status: plain.status,
    transactionReference: plain.transactionReference,
    gatewayOrderId: plain.gatewayOrderId,
    gatewayPaymentId: plain.gatewayPaymentId,
    paidAt: plain.paidAt,
    createdAt: plain.createdAt,
  };
};

export const serializeOrderPaymentList = (payments) => payments.map(serializeOrderPayment);
