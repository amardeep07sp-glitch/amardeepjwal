import { useState } from 'react';
import { Loader2, MapPin, X } from 'lucide-react';
import { useDeliveryLocation } from '@/lib/deliveryLocation';

const DISMISS_KEY = 'location-prompt-dismissed';

// A visible, explicit "Detect my location" CTA on the homepage itself -
// the header's own Deliver-to button (MainHeader.jsx/MobileMenu.jsx) does
// the same detection, but it's easy to miss tucked into the icon row.
// Only ever shows when there's genuinely no location set yet (no saved
// address, no prior detection) and the visitor hasn't dismissed it this
// browser before - never nags once they've said no or once a real
// location/address exists.
export function LocationPrompt() {
  const { label, isDetecting, detectLocation } = useDeliveryLocation();
  const [dismissed, setDismissed] = useState(() => {
    try {
      return sessionStorage.getItem(DISMISS_KEY) === '1';
    } catch {
      return false;
    }
  });

  if (label || dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    try {
      sessionStorage.setItem(DISMISS_KEY, '1');
    } catch {
      // sessionStorage unavailable (private browsing etc.) - dismissal just
      // won't persist across a reload, not worth failing over.
    }
  };

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl px-4 lg:px-8">
      <div className="relative flex flex-col gap-3 rounded-2xl bg-primary/8 p-4 ring-1 ring-primary/20 sm:flex-row sm:items-center sm:gap-3 sm:px-5 sm:py-3">
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss"
          className="absolute top-3 right-3 flex size-7 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground sm:static sm:order-3"
        >
          <X className="size-4" />
        </button>

        <div className="flex min-w-0 flex-1 items-center gap-3 pr-8 sm:pr-0">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/15 text-primary">
            <MapPin className="size-4.5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-medium text-heading">See accurate delivery estimates</p>
            <p className="text-xs text-muted-foreground">Detect your location for delivery time and shipping details.</p>
          </div>
        </div>

        <button
          type="button"
          onClick={detectLocation}
          disabled={isDetecting}
          className="flex w-full shrink-0 items-center justify-center gap-1.5 rounded-full bg-primary px-4 py-2 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover disabled:cursor-wait disabled:opacity-70 sm:order-2 sm:w-auto"
        >
          {isDetecting ? <Loader2 className="size-3.5 animate-spin" /> : <MapPin className="size-3.5" />}
          {isDetecting ? 'Detecting...' : 'Detect my location'}
        </button>
      </div>
    </section>
  );
}
