const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

export const serializeSupplierLedgerEntry = (entry) => {
  const plain = typeof entry.toObject === 'function' ? entry.toObject() : entry;
  return {
    id: plain._id,
    supplier: plain.supplier?.toString?.() ?? plain.supplier,
    type: plain.type,
    amount: plain.amount,
    balanceAfter: plain.balanceAfter,
    reason: plain.reason,
    referenceType: plain.referenceType,
    referenceId: plain.referenceId?.toString?.() ?? plain.referenceId,
    performedBy: serializeUserRef(plain.performedBy),
    createdAt: plain.createdAt,
  };
};

export const serializeSupplierLedgerList = (entries) => entries.map(serializeSupplierLedgerEntry);
