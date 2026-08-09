export const serializeSegmentSnapshot = (snapshot) => {
  const plain = typeof snapshot.toObject === 'function' ? snapshot.toObject() : snapshot;
  const customer = plain.customer;
  return {
    id: plain._id,
    customer: customer && customer.displayName !== undefined
      ? { id: customer._id.toString(), name: customer.displayName, customerCode: customer.customerCode, email: customer.email, phone: customer.phone }
      : customer?.toString?.() ?? customer,
    segments: plain.segments,
    metrics: plain.metrics,
    computedAt: plain.computedAt,
  };
};

export const serializeSegmentSnapshotList = (rows) => rows.map(serializeSegmentSnapshot);
