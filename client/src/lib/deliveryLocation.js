import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useStorefrontStore } from '@/store/storefrontStore';
import { useMyAddresses } from '@/features/storefront/storefrontApi';
import { api } from './api';

// The real "Deliver to" value the header shows - was a hardcoded string
// (config/appConfig.js's old DEFAULT_DELIVERY_LOCATION) that never
// reflected anything real. Priority: a signed-in customer's default
// shipping address (the actual thing "deliver to" means) beats a
// geolocation guess - only falls to geolocation when there's no address on
// file yet (or the visitor isn't signed in at all).
export function useDeliveryLocation() {
  const user = useAuthStore((s) => s.user);
  const deliveryLocation = useStorefrontStore((s) => s.deliveryLocation);
  const setDeliveryLocation = useStorefrontStore((s) => s.setDeliveryLocation);
  const { data: addresses } = useMyAddresses({ enabled: Boolean(user) });
  const [isDetecting, setIsDetecting] = useState(false);

  const defaultAddress = addresses?.find((a) => a.isDefaultShipping) ?? addresses?.[0];
  const addressLabel = defaultAddress ? [defaultAddress.city, defaultAddress.state].filter(Boolean).join(', ') : null;

  // A saved address always wins over a stale geolocation guess sitting in
  // the store from before the visitor logged in / added an address.
  useEffect(() => {
    if (addressLabel) setDeliveryLocation(addressLabel);
  }, [addressLabel, setDeliveryLocation]);

  const label = addressLabel ?? deliveryLocation;

  const applyResolved = (location) => {
    const resolved = [location.city, location.state].filter(Boolean).join(', ');
    if (resolved) setDeliveryLocation(resolved);
    return Boolean(resolved);
  };

  // IP geolocation always works (no prompt, no denial) but is only ever
  // city-level - the same fallback CIP visit-tracking already leans on
  // (geo.util.js#resolveLocationFromIp). Used whenever GPS isn't an option
  // at all, and as the fallback below when GPS IS attempted but fails.
  const detectByIp = async () => {
    setIsDetecting(true);
    try {
      const location = await api.get('/geo/detect-by-ip').then((res) => res.data);
      applyResolved(location);
    } catch {
      // silent - "Deliver to" just stays on its current label
    } finally {
      setIsDetecting(false);
    }
  };

  // User-initiated only (a click, never on mount) - the browser's own
  // permission prompt should only ever appear because someone asked for
  // their location, not as a surprise on page load. Tries GPS first (more
  // precise when granted - a real point, not just a city) and falls back
  // to IP-based detection on denial/timeout/no-GPS-hardware, rather than
  // leaving "Deliver to" stuck on "Select location" just because a laptop
  // has no GPS chip or the visitor said no to the prompt.
  const detectLocation = () => {
    if (typeof navigator === 'undefined' || !('geolocation' in navigator)) {
      detectByIp();
      return;
    }
    setIsDetecting(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const location = await api.post('/geo/reverse-lookup', { lat: latitude, lng: longitude }).then((res) => res.data);
          const applied = applyResolved(location);
          if (!applied) await detectByIp();
        } catch {
          await detectByIp();
        } finally {
          setIsDetecting(false);
        }
      },
      () => detectByIp(),
      { timeout: 8000, maximumAge: 10 * 60 * 1000 }
    );
  };

  return { label, hasAddress: Boolean(addressLabel), isDetecting, detectLocation };
}
