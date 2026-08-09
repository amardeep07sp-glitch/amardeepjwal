export const serializeLoyalty = (loyalty) => {
  const plain = typeof loyalty.toObject === 'function' ? loyalty.toObject() : loyalty;
  return {
    id: plain._id,
    customer: plain.customer?.toString?.() ?? plain.customer,
    currentPoints: plain.currentPoints,
    lifetimePointsEarned: plain.lifetimePointsEarned,
    currentTier: plain.currentTier,
    updatedAt: plain.updatedAt,
  };
};

export const serializeLoyaltyLedgerEntry = (entry) => {
  const plain = typeof entry.toObject === 'function' ? entry.toObject() : entry;
  return {
    id: plain._id,
    type: plain.type,
    points: plain.points,
    balanceAfter: plain.balanceAfter,
    reason: plain.reason,
    referenceType: plain.referenceType,
    referenceId: plain.referenceId?.toString?.() ?? plain.referenceId,
    expiresAt: plain.expiresAt,
    performedBy: plain.performedBy?.toString?.() ?? plain.performedBy,
    createdAt: plain.createdAt,
  };
};

export const serializeLoyaltyLedgerList = (entries) => entries.map(serializeLoyaltyLedgerEntry);
