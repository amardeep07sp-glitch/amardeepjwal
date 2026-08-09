export const serializeVisitor = (visitor) => {
  const plain = typeof visitor.toObject === 'function' ? visitor.toObject() : visitor;
  return {
    id: plain._id,
    visitorId: plain.visitorId,
    customer: plain.customer?.toString?.() ?? plain.customer,
    firstSeenAt: plain.firstSeenAt,
    lastSeenAt: plain.lastSeenAt,
    sessionCount: plain.sessionCount,
    isGuestCheckout: plain.isGuestCheckout,
    lastDevice: plain.lastDevice,
    lastLocation: plain.lastLocation,
  };
};

export const serializeVisitorList = (visitors) => visitors.map(serializeVisitor);
