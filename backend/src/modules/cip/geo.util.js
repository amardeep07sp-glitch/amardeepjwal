import { redisClient } from '../../config/redis.js';
import { logger } from '../../config/logger.js';
import { TRAFFIC_SOURCES } from './cip.constants.js';

const EMPTY_LOCATION = { country: '', state: '', city: '', approxLat: null, approxLng: null, timezone: '' };

// ipwho.is - free, keyless, HTTPS geo-IP lookup (no account/API key this
// project doesn't have, unlike MaxMind/ipapi.co/ipinfo.io's paid tiers).
// Called from event.service.js's synchronous, public, high-frequency
// trackEvent() path, so this must never be slow or throw - a hard timeout
// plus the existing "log+swallow" discipline (see category.service.js's
// own redisClient try/catch convention) keeps a flaky provider from ever
// degrading page-view tracking itself.
const GEOIP_URL = (ip) => `https://ipwho.is/${ip}`;
const GEOIP_TIMEOUT_MS = 2000;
const GEOIP_CACHE_TTL_SECONDS = 7 * 24 * 60 * 60; // IP->city mappings barely change; a week is safe.
const geoCacheKey = (ip) => `geoip:${ip}`;

// Loopback/private ranges a geo-IP provider can never resolve anyway
// (every localhost/dev/internal request) - skipped before spending a
// network round trip or a cache slot on them.
function isPublicIp(ip) {
  if (!ip) return false;
  if (ip === '::1' || ip === '127.0.0.1') return false;
  if (/^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[01])\.|::ffff:127\.|::ffff:10\.|::ffff:192\.168\.)/.test(ip)) return false;
  return true;
}

// city-level precision only ("never store precise GPS") - one decimal
// place is roughly an 11km grid, plenty for a "popular regions" report,
// nowhere near enough to pinpoint an actual address.
const roundCoord = (n) => (typeof n === 'number' ? Math.round(n * 10) / 10 : null);

async function fetchFromProvider(ip) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), GEOIP_TIMEOUT_MS);
  try {
    const res = await fetch(GEOIP_URL(ip), { signal: controller.signal });
    if (!res.ok) return null;
    const data = await res.json();
    if (!data.success) return null;
    return {
      country: data.country ?? '',
      state: data.region ?? '',
      city: data.city ?? '',
      approxLat: roundCoord(data.latitude),
      approxLng: roundCoord(data.longitude),
      timezone: data.timezone?.id ?? '',
    };
  } catch (err) {
    logger.warn({ err: err.message, ip }, 'Geo-IP lookup failed');
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

export async function resolveLocationFromIp(ip) {
  if (!isPublicIp(ip)) return { ...EMPTY_LOCATION };

  try {
    const cached = await redisClient.get(geoCacheKey(ip));
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn({ err: err.message }, 'Geo-IP cache read failed');
  }

  const resolved = await fetchFromProvider(ip);
  if (!resolved) return { ...EMPTY_LOCATION };

  try {
    await redisClient.set(geoCacheKey(ip), JSON.stringify(resolved), 'EX', GEOIP_CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err: err.message }, 'Geo-IP cache write failed');
  }

  return resolved;
}

// Nominatim (OpenStreetMap) - free, keyless reverse geocoding, same
// "no paid provider this project doesn't have an account for" reasoning as
// ipwho.is above. Its usage policy requires a real identifying User-Agent
// and asks callers to cache aggressively rather than re-querying the same
// point - both honored here (cache key rounds to ~1km, well within what a
// "which city/state" lookup needs).
const REVERSE_GEOCODE_URL = (lat, lng) =>
  `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${lat}&lon=${lng}&zoom=10&addressdetails=1`;
const REVERSE_GEOCODE_TIMEOUT_MS = 3000;
const REVERSE_GEOCODE_CACHE_TTL_SECONDS = 30 * 24 * 60 * 60; // coordinates never move
const reverseGeocodeCacheKey = (lat, lng) => `geocode:${lat.toFixed(2)}:${lng.toFixed(2)}`;

async function fetchReverseGeocode(lat, lng) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), REVERSE_GEOCODE_TIMEOUT_MS);
  try {
    const res = await fetch(REVERSE_GEOCODE_URL(lat, lng), {
      signal: controller.signal,
      headers: { 'User-Agent': 'AmardeepSwarnaKalaKendra/1.0 (admin@adsp.test)' },
    });
    if (!res.ok) return null;
    const data = await res.json();
    const addr = data.address ?? {};
    return {
      country: addr.country ?? '',
      state: addr.state ?? '',
      city: addr.city ?? addr.town ?? addr.village ?? addr.county ?? '',
      approxLat: roundCoord(lat),
      approxLng: roundCoord(lng),
      timezone: '',
    };
  } catch (err) {
    logger.warn({ err: err.message, lat, lng }, 'Reverse geocode lookup failed');
    return null;
  } finally {
    clearTimeout(timeout);
  }
}

// Turns a browser-geolocation lat/lng (real GPS, granted via the login
// permission prompt) into city/state/country - the ONE path in this
// codebase allowed to receive full-precision coordinates from the client,
// since the visitor explicitly consented to sharing them. Still never
// persists more than the same rounded ~11km precision resolveLocationFromIp
// stores, and the raw lat/lng passed in is never written to the DB by the
// caller (loginLocation.service.js) - only this function's rounded output.
export async function resolveLocationFromCoords(lat, lng) {
  if (typeof lat !== 'number' || typeof lng !== 'number') return { ...EMPTY_LOCATION };
  if (lat < -90 || lat > 90 || lng < -180 || lng > 180) return { ...EMPTY_LOCATION };

  const cacheKey = reverseGeocodeCacheKey(lat, lng);
  try {
    const cached = await redisClient.get(cacheKey);
    if (cached) return JSON.parse(cached);
  } catch (err) {
    logger.warn({ err: err.message }, 'Reverse geocode cache read failed');
  }

  const resolved = await fetchReverseGeocode(lat, lng);
  if (!resolved) return { ...EMPTY_LOCATION };

  try {
    await redisClient.set(cacheKey, JSON.stringify(resolved), 'EX', REVERSE_GEOCODE_CACHE_TTL_SECONDS);
  } catch (err) {
    logger.warn({ err: err.message }, 'Reverse geocode cache write failed');
  }

  return resolved;
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
