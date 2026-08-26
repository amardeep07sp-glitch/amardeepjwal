import { api } from './api';

// Triggers the browser's own native "Allow [site] to access your
// location?" permission prompt right after a successful login/register -
// never a custom in-app popup pretending to be that prompt. Entirely
// fire-and-forget: a denial, timeout, or unsupported browser is silent and
// never blocks/retries/nags - the storefront already has real IP-based
// location for every visit (cip/geo.util.js) as a fallback signal, so this
// is only ever a precision upgrade when a visitor happens to grant it.
export function captureLoginLocation() {
  if (typeof navigator === 'undefined' || !('geolocation' in navigator)) return;

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      api.post('/storefront/login-location', { lat: latitude, lng: longitude }).catch(() => {});
    },
    () => {},
    { timeout: 8000, maximumAge: 10 * 60 * 1000 }
  );
}
