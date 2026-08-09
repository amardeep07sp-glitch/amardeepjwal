export const serializeSession = (session) => {
  const plain = typeof session.toObject === 'function' ? session.toObject() : session;
  return {
    id: plain._id,
    sessionId: plain.sessionId,
    visitorId: plain.visitorId,
    customer: plain.customer?.toString?.() ?? plain.customer,
    visitorType: plain.visitorType,
    startTime: plain.startTime,
    lastActivityAt: plain.lastActivityAt,
    endTime: plain.endTime,
    loginTime: plain.loginTime,
    logoutTime: plain.logoutTime,
    durationSeconds: plain.durationSeconds,
    isBounce: plain.isBounce,
    isReturning: plain.isReturning,
    pageViewCount: plain.pageViewCount,
    eventCount: plain.eventCount,
    device: plain.device,
    location: plain.location,
    traffic: plain.traffic,
  };
};

export const serializeSessionList = (sessions) => sessions.map(serializeSession);
