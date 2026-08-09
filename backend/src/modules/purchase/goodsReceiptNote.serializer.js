const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name };
  return ref.toString();
};

const serializeLine = (line) => ({
  purchaseItem:
    line.purchaseItem && line.purchaseItem.sku !== undefined
      ? { id: line.purchaseItem._id.toString(), sku: line.purchaseItem.sku }
      : line.purchaseItem?.toString?.() ?? line.purchaseItem,
  receivedQuantity: line.receivedQuantity,
});

export const serializeGoodsReceiptNote = (grn) => {
  const plain = typeof grn.toObject === 'function' ? grn.toObject() : grn;
  return {
    id: plain._id,
    grnNumber: plain.grnNumber,
    purchaseOrder: plain.purchaseOrder?.toString?.() ?? plain.purchaseOrder,
    items: (plain.items ?? []).map(serializeLine),
    notes: plain.notes,
    receivedBy: serializeUserRef(plain.receivedBy),
    createdAt: plain.createdAt,
  };
};

export const serializeGoodsReceiptNoteList = (grns) => grns.map(serializeGoodsReceiptNote);
