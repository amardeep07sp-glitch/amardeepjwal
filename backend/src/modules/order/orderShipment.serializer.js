const serializeOrderRef = (ref) => {
  if (!ref) return null;
  if (ref.orderNumber !== undefined) return { id: ref._id.toString(), orderNumber: ref.orderNumber };
  return ref.toString();
};

export const serializeOrderShipment = (shipment) => {
  const plain = typeof shipment.toObject === 'function' ? shipment.toObject() : shipment;

  return {
    id: plain._id,
    order: serializeOrderRef(plain.order),
    shipmentNumber: plain.shipmentNumber,
    items: (plain.items ?? []).map((i) => i.toString?.() ?? i),
    courier: plain.courier,
    trackingNumber: plain.trackingNumber,
    trackingUrl: plain.trackingUrl,
    status: plain.status,
    estimatedDelivery: plain.estimatedDelivery,
    deliveredAt: plain.deliveredAt,
    createdAt: plain.createdAt,
  };
};

export const serializeOrderShipmentList = (shipments) => shipments.map(serializeOrderShipment);
