export const serializeAddress = (address) => {
  const plain = typeof address.toObject === 'function' ? address.toObject() : address;

  return {
    id: plain._id,
    customer: plain.customer?.toString?.() ?? plain.customer,
    type: plain.type,
    label: plain.label,
    line1: plain.line1,
    line2: plain.line2,
    city: plain.city,
    state: plain.state,
    postalCode: plain.postalCode,
    country: plain.country,
    phone: plain.phone,
    isDefaultBilling: plain.isDefaultBilling,
    isDefaultShipping: plain.isDefaultShipping,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeAddressList = (addresses) => addresses.map(serializeAddress);
