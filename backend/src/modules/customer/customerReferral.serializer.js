const serializeCustomerRef = (ref) => {
  if (!ref) return null;
  if (ref.displayName !== undefined) return { id: ref._id.toString(), name: ref.displayName, customerCode: ref.customerCode };
  return ref.toString();
};

export const serializeReferral = (referral) => {
  const plain = typeof referral.toObject === 'function' ? referral.toObject() : referral;
  return {
    id: plain._id,
    referrer: serializeCustomerRef(plain.referrer),
    referredCustomer: serializeCustomerRef(plain.referredCustomer),
    status: plain.status,
    rewardPoints: plain.rewardPoints,
    rewardedAt: plain.rewardedAt,
    createdAt: plain.createdAt,
  };
};

export const serializeReferralList = (referrals) => referrals.map(serializeReferral);
