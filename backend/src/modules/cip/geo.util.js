import { TRAFFIC_SOURCES } from './cip.constants.js';

// No paid geo-IP provider is wired in v1 (MaxMind/ipapi.co/ipinfo.io all
// need an account+key this project doesn't have) - kept async and
// single-entry-point so a real lookup drops in here later ("Future
// integrations ready") without any caller changing. Until then, every
// event/session honestly reports "unknown" location rather than fabricating
// coordinates - "Never store precise GPS" is trivially satisfied since
// nothing here ever produces anything more precise than city-level, and
// today it doesn't even produce that.
export async function resolveLocationFromIp() {
  return { country: '', state: '', city: '', approxLat: null, approxLng: null, timezone: '' };
}

const SOURCE_HOST_PATTERNS = [
  [TRAFFIC_SOURCES.GOOGLE, /google\./i],
  [TRAFFIC_SOURCES.FACEBOOK, /facebook\.com|fb\.com/i],
  [TRAFFIC_SOURCES.INSTAGRAM, /instagram\.com/i],
  [TRAFFIC_SOURCES.WHATSAPP, /whatsapp\.com|wa\.me/i],
];

// Pure - classifies a hit's traffic source from its UTM/referrer, in the
// same priority order every real analytics platform uses: an explicit UTM
// campaign always wins (it's a deliberate marketing link), then a known
// referrer host, then "direct" (no referrer at all).
export function resolveTrafficSource({ utmSource, referrer }) {
  if (utmSource) {
    const known = Object.values(TRAFFIC_SOURCES).find((s) => s === utmSource.toLowerCase());
    return known ?? TRAFFIC_SOURCES.CAMPAIGN;
  }
  if (!referrer) return TRAFFIC_SOURCES.DIRECT;
  if (/^mailto:|utm_medium=email/i.test(referrer)) return TRAFFIC_SOURCES.EMAIL;
  const matched = SOURCE_HOST_PATTERNS.find(([, pattern]) => pattern.test(referrer));
  return matched ? matched[0] : TRAFFIC_SOURCES.REFERRAL;
}
