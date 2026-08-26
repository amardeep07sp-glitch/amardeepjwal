import { Coins, Info } from 'lucide-react';
import { usePublicMetalRates } from '@/features/metalRates/metalRatesApi';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { EmptyState } from '@/components/global/EmptyState';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import { METAL_TREND_ICON } from '@/lib/metalTrend';

const TREND_COLOR = { up: 'text-emerald-600', down: 'text-rose-600', same: 'text-muted-foreground' };
const TREND_LABEL = { up: 'Up since last update', down: 'Down since last update', same: 'Unchanged' };

const RATE_ROWS = [
  { key: 'gold24k', label: '24K Gold', sublabel: '99.9% purity, investment grade' },
  { key: 'gold22k', label: '22K Gold', sublabel: '91.6% purity, most common for jewellery' },
  { key: 'gold18k', label: '18K Gold', sublabel: '75% purity, lighter daily-wear pieces' },
  { key: 'silver', label: 'Silver', sublabel: '92.5% sterling purity' },
];

export default function GoldRatePage() {
  const { data: rates, isLoading } = usePublicMetalRates();
  // Every rate still at its unset default (0) means the admin hasn't
  // configured today's rate yet - showing "Rs. 0.00" for all four rows
  // would read as a broken page, not "not entered yet", so this branches
  // to a real empty state instead.
  const hasRates = rates && [rates.gold24k, rates.gold22k, rates.gold18k, rates.silver].some((v) => v > 0);

  return (
    <PageContainer top="md" bottom="md">
      <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <BackButton />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: "Today's Gold Rate" }]} />
      </div>

      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 flex items-center gap-2.5 text-h3 font-display font-bold text-heading sm:text-h2">
          <Coins className="size-6 text-primary" /> Today's Metal Rates
        </h1>
        {!isLoading && rates?.updatedAt && (
          <p className="mb-6 text-sm text-muted-foreground">
            Last updated {new Date(rates.updatedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
          </p>
        )}

        {isLoading ? (
          <div className="rounded-2xl bg-card ring-1 ring-border">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between border-b border-border p-4 last:border-b-0">
                <Skeleton className="h-5 w-24" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        ) : !hasRates ? (
          <EmptyState
            icon={Coins}
            title="Rates not published yet"
            description="We haven't updated today's rate yet - please check back shortly or contact us directly."
          />
        ) : (
          <>
            <div className="rounded-2xl bg-card ring-1 ring-border">
              {RATE_ROWS.map((row) => {
                const trend = rates.trend?.[row.key];
                const TrendIcon = trend ? METAL_TREND_ICON[trend] : null;
                return (
                  <div key={row.key} className="flex items-center justify-between gap-3 border-b border-border p-4 last:border-b-0">
                    <div>
                      <p className="text-sm font-semibold text-heading">{row.label}</p>
                      <p className="text-xs text-muted-foreground">{row.sublabel}</p>
                    </div>
                    <div className="flex flex-col items-end gap-0.5">
                      <span className="text-lg font-bold text-heading">
                        {formatPrice(rates[row.key])}
                        <span className="ml-1 text-xs font-normal text-muted-foreground">
                          /{rates.unit?.replace('per ', '') ?? 'gram'}
                        </span>
                      </span>
                      {TrendIcon && (
                        <span className={`flex items-center gap-1 text-[11px] font-medium ${TREND_COLOR[trend]}`}>
                          <TrendIcon className="size-3" aria-hidden="true" />
                          {TREND_LABEL[trend]}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="mt-4 flex items-start gap-2 rounded-xl bg-secondary/50 p-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0 text-primary" />
              <p>
                Rates are updated manually by our team and may vary slightly from live market rates. Please confirm the exact rate with
                us before making a purchase decision. Product prices already reflect the rate at the time of listing.
              </p>
            </div>
          </>
        )}
      </div>
    </PageContainer>
  );
}
