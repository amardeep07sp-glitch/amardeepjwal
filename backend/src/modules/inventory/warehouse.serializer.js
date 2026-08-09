export const serializeWarehouse = (warehouse) => {
  const plain = typeof warehouse.toObject === 'function' ? warehouse.toObject() : warehouse;

  return {
    id: plain._id,
    name: plain.name,
    code: plain.code,
    address: plain.address,
    contactPerson: plain.contactPerson,
    phone: plain.phone,
    email: plain.email,
    status: plain.status,
    isDefault: plain.isDefault,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeWarehouseList = (warehouses) => warehouses.map(serializeWarehouse);
