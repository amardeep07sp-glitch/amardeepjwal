import { sessionRepository } from './session.repository.js';
import { visitorService } from './visitor.service.js';
import { SESSION_IDLE_TIMEOUT_MINUTES, BOUNCE_MAX_DURATION_SECONDS } from './cip.constants.js';

const buildPaginationMeta = (page, limit, totalItems) => ({
  page,
  limit,
  totalItems,
  totalPages: Math.max(1, Math.ceil(totalItems / limit)),
});

function idleCutoff() {
  return new Date(Date.now() - SESSION_IDLE_TIMEOUT_MINUTES * 60 * 1000);
}

export const sessionService = {
  // Called by event.service.js#trackEvent on every single event - creates
  // the Session on first sight (also bumping the Visitor's sessionCount
  // and resolving "is this visitor returning"), or just records the tick
  // on every event after that. THE only door either effect goes through.
  async getOrCreateSession({ sessionId, visitorId, customer, visitorType, device, location, traffic, isPageView }) {
    let session = await sessionRepository.findBySessionId(sessionId);
    if (!session) {
      const { isReturning } = await visitorService.recordNewSession(visitorId);
      session = await sessionRepository.create({
        sessionId,
        visitorId,
        customer,
        visitorType,
        device,
        location,
        traffic,
        isReturning,
        pageViewCount: isPageView ? 1 : 0,
        eventCount: 1,
      });
      return session;
    }

    return sessionRepository.recordActivity(sessionId, { isPageView });
  },

  recordLogin(sessionId, customerId, visitorType) {
    return sessionRepository.recordLogin(sessionId, customerId, visitorType);
  },

  recordLogout(sessionId) {
    return sessionRepository.recordLogout(sessionId);
  },

  // Ends a session explicitly (a real "logout"/tab-close beacon) - computes
  // the same duration/bounce figures the stale-session sweep computes for
  // sessions that just went quiet without ever announcing they were done.
  async closeSession(sessionId) {
    const session = await sessionRepository.findBySessionId(sessionId);
    if (!session || session.endTime) return session;
    return this._finalize(session);
  },

  // The stale-session sweep (session.jobs.js, run on a node-cron interval) -
  // no session is left "open" forever just because its tab was closed
  // without a beacon firing.
  async closeStaleSessions() {
    const stale = await sessionRepository.findStale(idleCutoff());
    let closed = 0;
    for (const session of stale) {
      // eslint-disable-next-line no-await-in-loop
      await this._finalize(session);
      closed += 1;
    }
    return closed;
  },

  async _finalize(session) {
    const endTime = new Date();
    const durationSeconds = Math.max(0, Math.round((endTime - session.startTime) / 1000));
    const isBounce = session.pageViewCount <= 1 && durationSeconds < BOUNCE_MAX_DURATION_SECONDS;
    return sessionRepository.closeById(session.sessionId, { durationSeconds, isBounce });
  },

  // "Realtime Visitors" / "Active Sessions" - Executive Dashboard cards.
  getActiveSessionCount() {
    return sessionRepository.countActive(idleCutoff());
  },

  async listSessions(query) {
    const { page, limit, ...filters } = query;
    const { items, total } = await sessionRepository.findPaginated({ page, limit, ...filters });
    return { items, meta: buildPaginationMeta(page, limit, total) };
  },
};
