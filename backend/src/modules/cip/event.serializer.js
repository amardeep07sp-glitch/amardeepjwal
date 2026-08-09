export const serializeEvent = (event) => {
  const plain = typeof event.toObject === 'function' ? event.toObject() : event;
  return {
    id: plain._id,
    eventType: plain.eventType,
    sessionId: plain.sessionId,
    visitorId: plain.visitorId,
    customer: plain.customer?.toString?.() ?? plain.customer,
    visitorType: plain.visitorType,
    page: plain.page,
    pageType: plain.pageType,
    device: plain.device,
    location: plain.location,
    traffic: plain.traffic,
    metadata: plain.metadata,
    occurredAt: plain.occurredAt,
  };
};

export const serializeEventList = (events) => events.map(serializeEvent);
