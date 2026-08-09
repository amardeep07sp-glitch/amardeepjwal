const serializeRef = (ref, extraFields = []) => {
  if (!ref) return null;
  if (ref.name !== undefined || ref.sku !== undefined) {
    const base = { id: ref._id.toString() };
    for (const field of ['name', 'slug', 'sku', 'code', ...extraFields]) {
      if (ref[field] !== undefined) base[field] = ref[field];
    }
    return base;
  }
  return ref.toString();
};

export const serializeInventory = (inventory) => {
  const plain = typeof inventory.toObject === 'function' ? inventory.toObject() : inventory;

  return {
    id: plain._id,
    product: serializeRef(plain.product),
    variant: serializeRef(plain.variant),
    warehouse: serializeRef(plain.warehouse),
    sku: plain.sku,
    barcode: serializeRef(plain.barcode),
    availableQuantity: plain.availableQuantity,
    reservedQuantity: plain.reservedQuantity,
    damagedQuantity: plain.damagedQuantity,
    returnedQuantity: plain.returnedQuantity,
    incomingQuantity: plain.incomingQuantity,
    minimumStock: plain.minimumStock,
    maximumStock: plain.maximumStock,
    reorderLevel: plain.reorderLevel,
    stockStatus: plain.stockStatus,
    active: plain.active,
    createdBy: serializeRef(plain.createdBy),
    updatedBy: serializeRef(plain.updatedBy),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeInventoryList = (items) => items.map(serializeInventory);

export const serializeMovement = (movement) => {
  const plain = typeof movement.toObject === 'function' ? movement.toObject() : movement;

  return {
    id: plain._id,
    inventory: plain.inventory?.toString?.() ?? plain.inventory,
    product: serializeRef(plain.product),
    variant: plain.variant?.toString?.() ?? plain.variant,
    warehouse: plain.warehouse?.toString?.() ?? plain.warehouse,
    movementType: plain.movementType,
    quantityBefore: plain.quantityBefore,
    quantityChanged: plain.quantityChanged,
    quantityAfter: plain.quantityAfter,
    reason: plain.reason,
    referenceType: plain.referenceType,
    referenceId: plain.referenceId?.toString?.() ?? plain.referenceId,
    performedBy: serializeRef(plain.performedBy),
    createdAt: plain.createdAt,
  };
};

export const serializeMovementList = (movements) => movements.map(serializeMovement);
