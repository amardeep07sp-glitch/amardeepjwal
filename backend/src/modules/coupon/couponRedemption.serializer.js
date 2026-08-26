const serializeCustomerRef = (ref) => {
  if (!ref) return null;
  if (ref.displayName !== undefined) return { id: ref._id.toString(), name: ref.displayName };
  return ref.toString();
};

const serializeOrderRef = (ref) => {
  if (!ref) return null;
  if (ref.orderNumber !== undefined) return { id: ref._id.toString(), orderNumber: ref.orderNumber, grandTotal: ref.grandTotal };
  return ref.toString();
};

export const serializeRedemption = (redemption) => {
  const plain = typeof redemption.toObject === 'function' ? redemption.toObject() : redemption;
  return {
    id: plain._id,
    couponId: plain.couponId?.toString?.() ?? plain.couponId,
    campaignId: plain.campaignId?.toString?.() ?? plain.campaignId,
    customer: serializeCustomerRef(plain.customerId),
    order: serializeOrderRef(plain.orderId),
    code: plain.code,
    discountAmount: plain.discountAmount,
    discountBase: plain.discountBase,
    status: plain.status,
    redeemedAt: plain.redeemedAt,
    cancelledAt: plain.cancelledAt,
    refundedAt: plain.refundedAt,
  };
};

export const serializeRedemptionList = (redemptions) => redemptions.map(serializeRedemption);
