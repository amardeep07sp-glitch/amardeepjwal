export const serializeSupplierAddress = (address) => {
  const plain = typeof address.toObject === 'function' ? address.toObject() : address;
  return {
    id: plain._id,
    supplier: plain.supplier?.toString?.() ?? plain.supplier,
    type: plain.type,
    label: plain.label,
    line1: plain.line1,
    line2: plain.line2,
    city: plain.city,
    state: plain.state,
    postalCode: plain.postalCode,
    country: plain.country,
    phone: plain.phone,
    isDefault: plain.isDefault,
    createdAt: plain.createdAt,
  };
};

export const serializeSupplierAddressList = (addresses) => addresses.map(serializeSupplierAddress);
