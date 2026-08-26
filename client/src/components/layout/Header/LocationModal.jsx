import { useState } from 'react';
import { Check, Compass, Loader2, MapPin, Navigation, Sparkles } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAuthStore } from '@/store/authStore';
import { useStorefrontStore } from '@/store/storefrontStore';
import { useMyAddresses } from '@/features/storefront/storefrontApi';
import { useDeliveryLocation } from '@/lib/deliveryLocation';

// Common major Indian jewellery hub pincodes for quick 1-click test/selection
const POPULAR_CITIES = [
  { city: 'Lucknow', state: 'Uttar Pradesh', pincode: '226001' },
  { city: 'Varanasi', state: 'Uttar Pradesh', pincode: '221001' },
  { city: 'Delhi NCR', state: 'Delhi', pincode: '110001' },
  { city: 'Mumbai', state: 'Maharashtra', pincode: '400001' },
  { city: 'Kanpur', state: 'Uttar Pradesh', pincode: '208001' },
  { city: 'Prayagraj', state: 'Uttar Pradesh', pincode: '211001' },
];

export function LocationModal({ open, onOpenChange }) {
  const [pincode, setPincode] = useState('');
  const [error, setError] = useState('');
  const user = useAuthStore((s) => s.user);
  const setDeliveryLocation = useStorefrontStore((s) => s.setDeliveryLocation);
  const { data: addresses } = useMyAddresses({ enabled: Boolean(user) });
  const { label: activeLocation, isDetecting, detectLocation } = useDeliveryLocation();

  const handleDetect = async () => {
    setError('');
    try {
      await detectLocation();
      onOpenChange(false);
    } catch {
      setError('Could not detect location. Please enter your pincode.');
    }
  };

  const handlePincodeSubmit = (e) => {
    e.preventDefault();
    const cleanPin = pincode.trim();
    if (!/^\d{6}$/.test(cleanPin)) {
      setError('Please enter a valid 6-digit Indian PIN code');
      return;
    }
    setError('');
    // Look up if it matches popular cities or format as Pincode
    const matched = POPULAR_CITIES.find((c) => c.pincode === cleanPin);
    const locationString = matched ? `${matched.city}, ${matched.state} (${cleanPin})` : `PIN ${cleanPin}`;
    setDeliveryLocation(locationString);
    onOpenChange(false);
  };

  const selectCity = (cityObj) => {
    setDeliveryLocation(`${cityObj.city}, ${cityObj.state}`);
    onOpenChange(false);
  };

  const selectAddress = (addr) => {
    const str = [addr.city, addr.state].filter(Boolean).join(', ');
    if (str) {
      setDeliveryLocation(str);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md rounded-3xl border border-[#EAE0CD] bg-white p-6 shadow-2xl">
        <DialogHeader className="gap-1 text-left">
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-[#FFF9EF] text-[#B88A2F]">
              <MapPin className="size-4.5" />
            </span>
            <DialogTitle className="font-serif text-lg font-bold text-[#1E0508]">
              Choose Your Delivery Location
            </DialogTitle>
          </div>
          <DialogDescription className="text-xs text-[#7A7265]">
            Select your delivery location to view accurate delivery dates and available jewellery services in your area.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Detect Location Button */}
          <button
            type="button"
            onClick={handleDetect}
            disabled={isDetecting}
            className="group flex w-full items-center justify-between rounded-2xl border border-[#EADFC7] bg-[#FCFAF6] p-3.5 text-left transition-all duration-200 hover:border-[#C8A24D] hover:bg-[#FFF9EF] disabled:cursor-wait"
          >
            <div className="flex items-center gap-3">
              <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-linear-to-br from-[#D4AF37] to-[#B8860B] text-white shadow-xs">
                {isDetecting ? (
                  <Loader2 className="size-4.5 animate-spin" />
                ) : (
                  <Navigation className="size-4.5 group-hover:rotate-45 transition-transform duration-300" />
                )}
              </span>
              <div>
                <p className="text-sm font-semibold text-[#2A080C]">
                  {isDetecting ? 'Detecting your location...' : 'Detect My Location'}
                </p>
                <p className="text-[11px] text-[#8C8273]">Using GPS or IP geolocation</p>
              </div>
            </div>
            <span className="text-xs font-medium text-[#B88A2F] group-hover:underline">
              Auto Detect
            </span>
          </button>

          {/* Enter Pincode form */}
          <form onSubmit={handlePincodeSubmit} className="space-y-2">
            <div className="relative flex items-center">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={6}
                value={pincode}
                onChange={(e) => {
                  setPincode(e.target.value.replace(/\D/g, ''));
                  setError('');
                }}
                placeholder="Enter 6-digit Pincode (e.g. 226001)"
                className="h-11 rounded-xl border-[#E5DAC4] bg-white pr-24 text-sm text-[#2A080C] placeholder:text-[#9E9584] focus:border-[#C8A24D] focus:ring-2 focus:ring-[#C8A24D]/20"
              />
              <Button
                type="submit"
                size="sm"
                className="absolute right-1.5 h-8 rounded-lg bg-linear-to-r from-[#2A080C] to-[#450D15] px-4 text-xs font-semibold text-[#FCE08B] hover:from-[#3E0C12] hover:to-[#5E121D]"
              >
                Apply
              </Button>
            </div>
            {error && <p className="text-xs font-medium text-destructive">{error}</p>}
          </form>

          {/* Saved Addresses (for logged in customers) */}
          {addresses?.length > 0 && (
            <div className="space-y-2 pt-1">
              <p className="text-[11px] font-bold tracking-wider text-[#9A6B12] uppercase">
                Saved Delivery Addresses
              </p>
              <div className="max-h-36 space-y-1.5 overflow-y-auto pr-1">
                {addresses.map((addr) => {
                  const label = [addr.city, addr.state].filter(Boolean).join(', ');
                  const isCurrent = activeLocation && activeLocation.includes(addr.city);
                  return (
                    <button
                      key={addr.id}
                      type="button"
                      onClick={() => selectAddress(addr)}
                      className={`flex w-full items-center justify-between rounded-xl border p-2.5 text-left text-xs transition-colors ${
                        isCurrent
                          ? 'border-[#C8A24D] bg-[#FFF9EF] font-medium text-[#2A080C]'
                          : 'border-[#EFE7D8] hover:bg-[#FAF6EE] text-[#4A443A]'
                      }`}
                    >
                      <div className="min-w-0 flex-1 truncate">
                        <span className="font-semibold">{addr.fullName || addr.addressType || 'Address'}</span>
                        <span className="text-[#7A7265] ml-1.5">
                          {addr.addressLine1 ? `${addr.addressLine1}, ` : ''}{label} - {addr.pincode}
                        </span>
                      </div>
                      {isCurrent && <Check className="size-4 shrink-0 text-[#C8A24D]" />}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Quick Select Cities */}
          <div className="space-y-2 pt-1">
            <p className="text-[11px] font-bold tracking-wider text-[#9A6B12] uppercase">
              Popular Cities
            </p>
            <div className="flex flex-wrap gap-1.5">
              {POPULAR_CITIES.map((c) => (
                <button
                  key={c.pincode}
                  type="button"
                  onClick={() => selectCity(c)}
                  className="rounded-full border border-[#EAE0CD] bg-[#FAF8F4] px-3 py-1 text-xs text-[#3E3830] transition-colors hover:border-[#C8A24D] hover:bg-[#FFF9EF] hover:text-[#9A6B12]"
                >
                  {c.city}
                </button>
              ))}
            </div>
          </div>

          {activeLocation && (
            <div className="rounded-xl bg-[#FFF9EF] p-2.5 text-center text-xs text-[#7A5B15]">
              Currently Delivering to: <span className="font-semibold text-[#2A080C]">{activeLocation}</span>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
