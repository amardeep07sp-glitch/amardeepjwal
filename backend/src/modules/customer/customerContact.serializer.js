export const serializeContact = (contact) => {
  const plain = typeof contact.toObject === 'function' ? contact.toObject() : contact;
  return {
    id: plain._id,
    customer: plain.customer?.toString?.() ?? plain.customer,
    name: plain.name,
    designation: plain.designation,
    email: plain.email,
    phone: plain.phone,
    isPrimary: plain.isPrimary,
    createdAt: plain.createdAt,
  };
};

export const serializeContactList = (contacts) => contacts.map(serializeContact);
