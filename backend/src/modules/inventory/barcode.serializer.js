const serializeRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined || ref.sku !== undefined) {
    return { id: ref._id.toString(), name: ref.name, sku: ref.sku };
  }
  return ref.toString();
};

export const serializeBarcode = (barcode) => {
  const plain = typeof barcode.toObject === 'function' ? barcode.toObject() : barcode;

  return {
    id: plain._id,
    barcodeValue: plain.barcodeValue,
    barcodeType: plain.barcodeType,
    product: serializeRef(plain.product),
    variant: serializeRef(plain.variant),
    status: plain.status,
    generatedAt: plain.generatedAt,
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeBarcodeList = (barcodes) => barcodes.map(serializeBarcode);
