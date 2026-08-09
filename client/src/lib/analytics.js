import { useAuthStore } from '@/store/authStore';

// The storefront's half of the CIP Event Engine (backend/src/modules/cip) -
// that engine and its admin dashboard already exist and work; this file is
// the one piece that was missing, the thing that actually calls
// POST /cip/events/track. Every field name here matches
// event.validation.js#trackEventSchema exactly - device.type/browser/os and
// location are resolved server-side (User-Agent header, IP), so this SDK
// only ever sends what's genuinely client-only (screen/language/timezone/
// network) plus the event's own identity and payload.
const TRACK_URL = '/api/v1/cip/events/track';
const SESSION_END_URL = (sessionId) => `/api/v1/cip/sessions/${sessionId}/end`;

const VISITOR_ID_KEY = 'adsp_visitor_id';
const SESSION_ID_KEY = 'adsp_session_id';
const SESSION_TRAFFIC_KEY = 'adsp_session_traffic';

const uuid = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(16).slice(2)}`);

// Long-lived (localStorage) - one visitor across many browsing sessions,
// same identity model as visitor.model.js on the backend.
function getVisitorId() {
  let id = localStorage.getItem(VISITOR_ID_KEY);
  if (!id) {
    id = uuid();
    localStorage.setItem(VISITOR_ID_KEY, id);
  }
  return id;
}

// Tab/session-scoped (sessionStorage) - clears on tab close, which is
// exactly session.model.js's own boundary (backed up server-side by the
// 30-minute idle sweep in cip.jobs.js for tabs left open and abandoned).
function getSessionId() {
  let id = sessionStorage.getItem(SESSION_ID_KEY);
  if (!id) {
    id = uuid();
    sessionStorage.setItem(SESSION_ID_KEY, id);
  }
  return id;
}

// Captured once, at this session's first hit, and reused for every event
// in it - a same-session internal navigation (home -> a product page) must
// never overwrite the campaign/referrer that actually brought this
// visitor in with an empty in-site referrer.
function getSessionTraffic() {
  const cached = sessionStorage.getItem(SESSION_TRAFFIC_KEY);
  if (cached) return JSON.parse(cached);

  const params = new URLSearchParams(window.location.search);
  const traffic = {
    referrer: document.referrer || '',
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
    utmTerm: params.get('utm_term') || '',
    utmContent: params.get('utm_content') || '',
    landingPage: window.location.pathname,
  };
  sessionStorage.setItem(SESSION_TRAFFIC_KEY, JSON.stringify(traffic));
  return traffic;
}

function getDeviceContext() {
  return {
    screenResolution: `${window.screen?.width ?? 0}x${window.screen?.height ?? 0}`,
    language: navigator.language || '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || '',
    network: navigator.connection?.effectiveType || '',
  };
}

function buildPayload(eventType, { page, pageType, metadata } = {}) {
  const { user } = useAuthStore.getState();
  return {
    eventType,
    sessionId: getSessionId(),
    visitorId: getVisitorId(),
    customerId: user?.id ?? null,
    isRegistered: Boolean(user),
    page: page ?? window.location.pathname,
    pageType: pageType ?? '',
    metadata: metadata ?? {},
    ...getDeviceContext(),
    ...getSessionTraffic(),
  };
}

// Fire-and-forget by design - an analytics call must never throw, retry, or
// block the UI it's observing. A blocked/failed request (ad-blocker,
// offline) is just a missed data point, not a user-facing error.
// `keepalive` lets it still complete if it's fired right as the user
// navigates away (a plain fetch gets cancelled mid-flight then).
export function track(eventType, options) {
  try {
    fetch(TRACK_URL, {
      method: 'POST',
      credentials: 'include',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(buildPayload(eventType, options)),
      keepalive: true,
    }).catch(() => {});
  } catch {
    // Never let a tracking call take the page down with it.
  }
}

export const trackPageView = (pageType, metadata) => track('page_view', { pageType, metadata });

// The one call that specifically races page unload (leaving a product page,
// closing the tab) - sendBeacon (not fetch) is the one API a browser
// guarantees gets to actually leave, even mid-navigation. A Blob with an
// explicit type is what makes the backend see `application/json`, not
// sendBeacon's default `text/plain`.
function sendBeaconJson(url, payload) {
  if (!navigator.sendBeacon) return false;
  return navigator.sendBeacon(url, new Blob([JSON.stringify(payload)], { type: 'application/json' }));
}

// A product view is reported exactly once per visit, at the point of
// leaving (not on mount) - the only way to attach a real
// `timeSpentSeconds` to a write-once event without a second, double-
// counted document. An early bounce that never fires this simply reports
// no view for that visit, which is itself an honest signal, not a bug.
export function trackProductViewEnd(productId, timeSpentSeconds) {
  const payload = buildPayload('product_view', { metadata: { productId, timeSpentSeconds: Math.round(timeSpentSeconds) } });
  if (!sendBeaconJson(TRACK_URL, payload)) track('product_view', { metadata: { productId } });
}

// Closes out the session with a real duration server-side (session.model.js)
// instead of leaving it to the 30-minute idle sweep to guess - called once,
// on tab close (see App.jsx).
export function endSession() {
  const sessionId = sessionStorage.getItem(SESSION_ID_KEY);
  if (!sessionId || !navigator.sendBeacon) return;
  navigator.sendBeacon(SESSION_END_URL(sessionId));
}
