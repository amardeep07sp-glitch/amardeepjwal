export const serializeWallet = (wallet) => {
  const plain = typeof wallet.toObject === 'function' ? wallet.toObject() : wallet;
  return {
    id: plain._id,
    customer: plain.customer?.toString?.() ?? plain.customer,
    balance: plain.balance,
    updatedAt: plain.updatedAt,
  };
};

export const serializeWalletLedgerEntry = (entry) => {
  const plain = typeof entry.toObject === 'function' ? entry.toObject() : entry;
  return {
    id: plain._id,
    type: plain.type,
    amount: plain.amount,
    balanceAfter: plain.balanceAfter,
    reason: plain.reason,
    referenceType: plain.referenceType,
    referenceId: plain.referenceId?.toString?.() ?? plain.referenceId,
    performedBy: plain.performedBy?.toString?.() ?? plain.performedBy,
    createdAt: plain.createdAt,
  };
};

export const serializeWalletLedgerList = (entries) => entries.map(serializeWalletLedgerEntry);
