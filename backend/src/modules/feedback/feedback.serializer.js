const serializeCustomerRef = (ref) => {
  if (!ref) return null;
  if (typeof ref === 'object' && ref.displayName !== undefined) return { id: ref._id.toString(), name: ref.displayName, phone: ref.phone, email: ref.email };
  return ref.toString();
};

export const serializeFeedback = (feedback) => {
  const plain = typeof feedback.toObject === 'function' ? feedback.toObject() : feedback;
  return {
    id: plain._id,
    customer: serializeCustomerRef(plain.customer),
    rating: plain.rating,
    category: plain.category,
    message: plain.message,
    pageContext: plain.pageContext,
    orderId: plain.orderId?.toString?.() ?? plain.orderId,
    createdAt: plain.createdAt,
  };
};

export const serializeFeedbackList = (items) => items.map(serializeFeedback);
