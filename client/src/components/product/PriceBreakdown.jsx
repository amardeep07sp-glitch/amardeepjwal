import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { usePublicMetalRates } from '@/features/metalRates/metalRatesApi';
import { METAL_TREND_ICON } from '@/lib/metalTrend';

const LIVE_TREND_COLOR = { up: 'text-emerald-600', down: 'text-rose-600', same: 'text-muted-foreground' };

// Real jewellery-industry price transparency - gold rate, making charges,
// wastage, stone/diamond/labour cost, tax - everything the backend's
// pricing schema actually stores except costPrice (the store's own
// margin, never shown). Rows with a zero value are simply omitted rather
// than padding the breakup with meaningless "₹0" lines.
export function PriceBreakdown({ price, breakdown }) {
  const [open, setOpen] = useState(false);
  const { data: liveRates } = usePublicMetalRates();

  // goldRateSnapshot/silverRateSnapshot are captured once, at the time this
  // product's price was set - they are NOT overwritten as the live rate
  // moves (see pricing.schema.js), and finalPrice never re-derives from
  // them. Showing today's live rate here is a read-only comparison next to
  // that historical snapshot, not a replacement for it - the snapshot
  // stays the source of truth for why this specific price is what it is.
  // Gold has no purity field on the snapshot, so the 24K base rate is the
  // only honest reference point; silver has a single sterling rate, so
  // that comparison is exact.
  const liveGoldRate = liveRates?.gold24k > 0 ? liveRates.gold24k : null;
  const liveSilverRate = liveRates?.silver > 0 ? liveRates.silver : null;

  const rows = [
    { label: 'MRP', value: formatPrice(price.mrp) },
    breakdown.goldRateSnapshot > 0 && {
      label: 'Gold Rate (per gram)',
      value: formatPrice(breakdown.goldRateSnapshot),
      liveNote: liveGoldRate && {
        text: `Today's 24K rate: ${formatPrice(liveGoldRate)}/g`,
        trend: liveRates?.trend?.gold24k,
      },
    },
    breakdown.silverRateSnapshot > 0 && {
      label: 'Silver Rate (per gram)',
      value: formatPrice(breakdown.silverRateSnapshot),
      liveNote: liveSilverRate && { text: `Today's rate: ${formatPrice(liveSilverRate)}/g`, trend: liveRates?.trend?.silver },
    },
    breakdown.makingCharges > 0 && {
      label: 'Making Charges',
      value: breakdown.makingChargeType === 'percentage' ? `${breakdown.makingCharges}%` : formatPrice(breakdown.makingCharges),
    },
    breakdown.wastagePercentage > 0 && { label: 'Wastage', value: `${breakdown.wastagePercentage}%` },
    breakdown.stoneCost > 0 && { label: 'Stone Charges', value: formatPrice(breakdown.stoneCost) },
    breakdown.diamondCost > 0 && { label: 'Diamond Charges', value: formatPrice(breakdown.diamondCost) },
    breakdown.labourCost > 0 && { label: 'Labour Charges', value: formatPrice(breakdown.labourCost) },
    price.discountPercentage > 0 && { label: 'Discount', value: `- ${price.discountPercentage}%` },
    breakdown.taxPercentage > 0 && {
      label: `GST${breakdown.taxIncluded ? ' (included)' : ''}`,
      value: `${breakdown.taxPercentage}%`,
    },
  ].filter(Boolean);

  if (rows.length <= 1) return null;

  return (
    <div className="rounded-lg ring-1 ring-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center justify-between px-4 py-3 text-sm font-medium text-heading"
      >
        Price Breakup
        <ChevronDown className={cn('size-4 text-muted-foreground transition-transform duration-200', open && 'rotate-180')} />
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2, ease: 'easeInOut' }}
            className="overflow-hidden"
          >
            <dl className="flex flex-col gap-2 border-t border-border px-4 py-3">
              {rows.map((row) => {
                const TrendIcon = row.liveNote?.trend ? METAL_TREND_ICON[row.liveNote.trend] : null;
                return (
                  <div key={row.label} className="flex items-center justify-between gap-3 text-sm">
                    <dt className="text-muted-foreground">{row.label}</dt>
                    <dd className="flex flex-col items-end gap-0.5">
                      <span className="font-medium text-foreground">{row.value}</span>
                      {row.liveNote && (
                        <span
                          className={cn(
                            'flex items-center gap-1 text-[11px] font-normal',
                            row.liveNote.trend ? LIVE_TREND_COLOR[row.liveNote.trend] : 'text-muted-foreground'
                          )}
                        >
                          {TrendIcon && <TrendIcon className="size-3" aria-hidden="true" />}
                          {row.liveNote.text}
                        </span>
                      )}
                    </dd>
                  </div>
                );
              })}
              <div className="flex items-center justify-between border-t border-border pt-2 text-sm font-semibold">
                <dt className="text-heading">Final Price</dt>
                <dd className="text-heading">{formatPrice(price.finalPrice)}</dd>
              </div>
            </dl>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
