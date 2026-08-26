import { ArrowRight } from 'lucide-react';
import { SmartLink } from '@/components/global/SmartLink';
import { usePublicMetalRates } from '@/features/metalRates/metalRatesApi';
import { formatPrice } from '@/lib/format';
import { METAL_TREND_ICON } from '@/lib/metalTrend';
import { Skeleton } from '@/components/ui/skeleton';

const METALS = [
  { key: 'gold24k', label: '24K Gold' },
  { key: 'gold22k', label: '22K Gold' },
  { key: 'gold18k', label: '18K Gold' },
  { key: 'silver', label: 'Silver' },
];

const TREND_COLOR = { up: 'text-emerald-600', down: 'text-rose-600', same: 'text-muted-foreground' };

// A light, gold-tinted card (not a dark ribbon) - sits on the storefront's
// mostly-white background, so it reads as part of the same premium cream/
// gold palette as GoldRatePage's rate card and TrustBadges' gradient strip,
// rather than a heavy black bar. Staff already key these rates in daily via
// Admin -> Metal Rates, so this is real data, not a placeholder.
export function MetalRateStrip() {
  const { data: rates, isLoading } = usePublicMetalRates();
  const hasRates = rates && METALS.some((metal) => rates[metal.key] > 0);

  // A skeleton placeholder while loading, not `null` - returning `null`
  // here left a gap where this section would eventually sit, so once the
  // rates query resolved a beat after first paint, the strip popped in and
  // shoved the hero (and everything below it) down - a real layout shift,
  // most visible on a real device's slower first load, not a static
  // screenshot. Only genuinely renders nothing once loading has finished
  // AND no rate has ever been published - that's a real "nothing to show"
  // state, not a shift-causing one, since it resolves once and stays put.
  if (isLoading) {
    return (
      <section className="mx-auto w-full min-w-0 max-w-7xl px-4 pt-3 sm:pt-4 lg:px-8">
        <Skeleton className="h-11.25 w-full rounded-full" />
      </section>
    );
  }

  if (!hasRates) return null;

  return (
    <section className="mx-auto w-full min-w-0 max-w-7xl px-4 pt-3 sm:pt-4 lg:px-8">
      <div className="scrollbar-none flex items-center gap-5 overflow-x-auto rounded-full bg-linear-to-r from-primary/10 via-gold/15 to-primary/10 px-5 py-2.5 ring-1 ring-primary/25 sm:gap-7">
        <span className="shrink-0 text-[11px] font-semibold tracking-[0.15em] text-primary uppercase sm:text-xs">
          Today's Rate
        </span>

        {METALS.map((metal) => {
          const value = rates[metal.key];
          if (!(value > 0)) return null;
          const trend = rates.trend?.[metal.key];
          const TrendIcon = trend ? METAL_TREND_ICON[trend] : null;

          return (
            <span
              key={metal.key}
              className="flex shrink-0 items-center gap-1.5 text-xs font-medium whitespace-nowrap text-heading sm:text-[13px]"
            >
              <span className="text-muted-foreground">{metal.label}</span>
              <span className="font-semibold text-heading">{formatPrice(value)}</span>
              {TrendIcon && <TrendIcon className={`size-3.5 ${TREND_COLOR[trend]}`} aria-hidden="true" />}
            </span>
          );
        })}

        <SmartLink
          to="/gold-rate"
          className="ml-auto flex shrink-0 items-center gap-1 text-xs font-semibold text-primary transition-colors hover:text-primary-hover"
        >
          View All <ArrowRight className="size-3" />
        </SmartLink>
      </div>
    </section>
  );
}
