const serializeUserRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, email: ref.email, phone: ref.phone };
  return ref.toString();
};

// Customer (CRM) refs use displayName, not User's `name` - kept as its own
// function rather than overloading serializeUserRef, since createdBy/
// updatedBy on Order are genuinely staff Users, not Customers.
const serializeCustomerRef = (ref) => {
  if (!ref) return null;
  if (ref.displayName !== undefined) {
    return { id: ref._id.toString(), name: ref.displayName, email: ref.email, phone: ref.phone, customerCode: ref.customerCode };
  }
  return ref.toString();
};

const serializeWarehouseRef = (ref) => {
  if (!ref) return null;
  if (ref.name !== undefined) return { id: ref._id.toString(), name: ref.name, code: ref.code };
  return ref.toString();
};

const serializeAddressRef = (ref) => {
  if (!ref) return null;
  if (ref.line1 !== undefined) {
    return {
      id: ref._id.toString(),
      label: ref.label,
      line1: ref.line1,
      line2: ref.line2,
      city: ref.city,
      state: ref.state,
      postalCode: ref.postalCode,
      country: ref.country,
      phone: ref.phone,
    };
  }
  return ref.toString();
};

export const serializeOrder = (order) => {
  const plain = typeof order.toObject === 'function' ? order.toObject() : order;

  return {
    id: plain._id,
    orderNumber: plain.orderNumber,
    customer: serializeCustomerRef(plain.customer),
    customerSnapshot: plain.customerSnapshot,
    billingAddress: serializeAddressRef(plain.billingAddress),
    shippingAddress: serializeAddressRef(plain.shippingAddress),
    billingAddressSnapshot: plain.billingAddressSnapshot,
    shippingAddressSnapshot: plain.shippingAddressSnapshot,
    warehouse: serializeWarehouseRef(plain.warehouse),
    currency: plain.currency,
    subtotal: plain.subtotal,
    discount: plain.discount,
    couponCode: plain.couponCode ?? null,
    couponDiscount: plain.couponDiscount,
    promotionSnapshot: plain.promotionSnapshot ?? null,
    tax: plain.tax,
    shippingCharge: plain.shippingCharge,
    handlingCharge: plain.handlingCharge,
    grandTotal: plain.grandTotal,
    paymentStatus: plain.paymentStatus,
    orderStatus: plain.orderStatus,
    fulfillmentStatus: plain.fulfillmentStatus,
    paymentMethod: plain.paymentMethod,
    notes: plain.notes,
    internalNotes: plain.internalNotes,
    source: plain.source,
    createdBy: serializeUserRef(plain.createdBy),
    updatedBy: serializeUserRef(plain.updatedBy),
    createdAt: plain.createdAt,
    updatedAt: plain.updatedAt,
  };
};

export const serializeOrderList = (orders) => orders.map(serializeOrder);
