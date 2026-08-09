export const serializeSupplier = (supplier) => {
  const plain = typeof supplier.toObject === 'function' ? supplier.toObject() : supplier;
  return {
    id: plain._id,
    supplierCode: plain.supplierCode,
    name: plain.name,
    contactPerson: plain.contactPerson,
    email: plain.email,
    phone: plain.phone,
    gstNumber: plain.gstNumber,
    panNumber: plain.panNumber,
    bankDetails: plain.bankDetails ?? {},
    status: plain.status,
    outstandingBalance: plain.outstandingBalance,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeSupplierList = (suppliers) => suppliers.map(serializeSupplier);

// Reused by purchaseOrder.model.js for its supplierSnapshot shape - kept in
// sync deliberately, see purchaseOrder.service.js#buildSupplierSnapshot.
export const serializeSupplierRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'string') return ref;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, supplierCode: ref.supplierCode };
  return ref.toString();
};
