export const serializeSupplierContact = (contact) => {
  const plain = typeof contact.toObject === 'function' ? contact.toObject() : contact;
  return {
    id: plain._id,
    supplier: plain.supplier?.toString?.() ?? plain.supplier,
    name: plain.name,
    designation: plain.designation,
    email: plain.email,
    phone: plain.phone,
    isPrimary: plain.isPrimary,
    createdAt: plain.createdAt,
  };
};

export const serializeSupplierContactList = (contacts) => contacts.map(serializeSupplierContact);
