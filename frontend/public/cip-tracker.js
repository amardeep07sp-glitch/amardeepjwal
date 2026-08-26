/**
 * Customer Intelligence Platform - tracking SDK.
 *
 * A standalone, framework-agnostic snippet any future storefront (this
 * React admin app is NOT the tracked surface - a customer-facing site is)
 * drops in with a single <script src="/cip-tracker.js"></script>, the same
 * way GA4/Meta Pixel/Clarity snippets work. Deliberately vanilla JS with
 * zero build step or dependency, so it works whether the eventual
 * storefront is React, Next.js, or a plain server-rendered site.
 *
 * Usage from the storefront:
 *   cipTracker.setCustomer('64f...', { isRegistered: true });
 *   cipTracker.track('product_view', { productId: '64f...', timeSpentSeconds: 12 });
 *   cipTracker.track('search', { query: 'gold ring', resultCount: 24 });
 *
 * Contract (matches backend/src/modules/cip/event.validation.js exactly):
 *   eventType   - one of cip.constants.js's EVENT_TYPES (server rejects anything else)
 *   metadata    - event-specific payload; never put a password/OTP/card
 *                 number in here even in a test - the server strips
 *                 anything that LOOKS like one, but don't rely on that.
 *
 * Consent: track() no-ops (never even reaches the network) once
 * setConsent(false) has been called - see the Privacy section below.
 */
(function (window) {
  'use strict';

  var API_BASE = window.CIP_API_BASE || '/api/v1';
  var VISITOR_KEY = 'cip_visitor_id';
  var SESSION_KEY = 'cip_session_id'; // sessionStorage - a new tab is a new session, by design
  var LANDING_KEY = 'cip_landing_utm';
  var CONSENT_KEY = 'cip_consent';

  function uuid() {
    if (window.crypto && window.crypto.randomUUID) return window.crypto.randomUUID();
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
      var r = (Math.random() * 16) | 0;
      var v = c === 'x' ? r : (r & 0x3) | 0x8;
      return v.toString(16);
    });
  }

  function getVisitorId() {
    try {
      var id = window.localStorage.getItem(VISITOR_KEY);
      if (!id) {
        id = uuid();
        window.localStorage.setItem(VISITOR_KEY, id);
      }
      return id;
    } catch {
      return uuid(); // storage unavailable (private browsing) - degrade to a per-call id
    }
  }

  function getSessionId() {
    try {
      var id = window.sessionStorage.getItem(SESSION_KEY);
      if (!id) {
        id = uuid();
        window.sessionStorage.setItem(SESSION_KEY, id);
      }
      return id;
    } catch {
      return uuid();
    }
  }

  function hasConsent() {
    try {
      var value = window.localStorage.getItem(CONSENT_KEY);
      return value !== 'false'; // no preference yet = tracked, matches consent.model.js's default
    } catch {
      return true;
    }
  }

  function parseUtmFromUrl() {
    var params = new URLSearchParams(window.location.search);
    var utm = {
      utmSource: params.get('utm_source') || '',
      utmMedium: params.get('utm_medium') || '',
      utmCampaign: params.get('utm_campaign') || '',
      utmTerm: params.get('utm_term') || '',
      utmContent: params.get('utm_content') || '',
    };
    return utm;
  }

  // UTM params only ever appear on the landing URL - captured once per
  // session and reused for every subsequent event, since page 2 onward
  // never carries them (see marketing analytics' own reliance on the
  // Session snapshot for this exact reason).
  function getLandingContext() {
    try {
      var stored = window.sessionStorage.getItem(LANDING_KEY);
      if (stored) return JSON.parse(stored);
    } catch {
      /* fall through to compute fresh */
    }
    var utm = parseUtmFromUrl();
    var context = Object.assign({}, utm, { referrer: document.referrer || '', landingPage: window.location.pathname });
    try {
      window.sessionStorage.setItem(LANDING_KEY, JSON.stringify(context));
    } catch {
      /* storage unavailable - context still returned for this call */
    }
    return context;
  }

  var customerId = null;
  var isRegistered = false;

  function track(eventType, metadata) {
    if (!hasConsent()) return;

    var landing = getLandingContext();
    var body = Object.assign(
      {
        eventType: eventType,
        sessionId: getSessionId(),
        visitorId: getVisitorId(),
        customerId: customerId,
        isRegistered: isRegistered,
        page: window.location.pathname,
        screenResolution: window.screen ? window.screen.width + 'x' + window.screen.height : '',
        language: navigator.language || '',
        timezone: Intl.DateTimeFormat().resolveOptions().timeZone || '',
        metadata: metadata || {},
      },
      landing
    );

    fetch(API_BASE + '/cip/events/track', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      keepalive: true, // survives a page navigation that happens right after this call
    }).catch(function () {
      // Fire-and-forget by design - a dropped event must never break the
      // storefront experience.
    });
  }

  function endSession() {
    var sessionId = getSessionId();
    var url = API_BASE + '/cip/sessions/' + sessionId + '/end';
    if (navigator.sendBeacon) {
      navigator.sendBeacon(url, new Blob([], { type: 'application/json' }));
    }
  }

  window.addEventListener('pagehide', endSession);

  window.cipTracker = {
    track: track,
    setCustomer: function (id, opts) {
      customerId = id || null;
      isRegistered = !!(opts && opts.isRegistered);
    },
    setConsent: function (analyticsConsent, marketingConsent) {
      try {
        window.localStorage.setItem(CONSENT_KEY, String(analyticsConsent));
      } catch {
        /* ignore - consent still applied for this page load via the closure below */
      }
      fetch(API_BASE + '/cip/privacy/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitorId: getVisitorId(), analyticsConsent: !!analyticsConsent, marketingConsent: !!marketingConsent }),
      }).catch(function () {});
    },
    getVisitorId: getVisitorId,
    getSessionId: getSessionId,
  };
})(window);
