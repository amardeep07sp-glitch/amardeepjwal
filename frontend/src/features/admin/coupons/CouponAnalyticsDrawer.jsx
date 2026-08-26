import { Drawer } from '@/components/global/Drawer';
import { useCouponAnalytics, useCouponRedemptions } from './couponsApi';

const StatCard = ({ label, value }) => (
  <div className="rounded-lg border border-border bg-muted/40 p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="mt-1 text-lg font-semibold text-heading">{value}</p>
  </div>
);

const formatDate = (value) => new Date(value).toLocaleString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });

// Section 44's scoped-down core: real redemption count + real discount
// total (from the permanent CouponRedemption ledger, never derived from
// Coupon.usageCount alone) plus a recent-activity list - not the full
// ROI/funnel/budget-chart dashboard.
export function CouponAnalyticsDrawer({ open, onOpenChange, coupon }) {
  const { data: summary, isLoading: isSummaryLoading } = useCouponAnalytics(coupon?.id, { enabled: open && Boolean(coupon) });
  const { data: redemptionsData, isLoading: isRedemptionsLoading } = useCouponRedemptions(
    { couponId: coupon?.id, page: 1, limit: 20 },
    { enabled: open && Boolean(coupon) }
  );
  const redemptions = redemptionsData?.items ?? [];

  return (
    <Drawer open={open} onOpenChange={onOpenChange} title={coupon ? `"${coupon.code}" analytics` : 'Analytics'} className="sm:max-w-md">
      {isSummaryLoading ? (
        <p className="py-8 text-center text-sm text-muted-foreground">Loading...</p>
      ) : (
        <div className="flex flex-col gap-5 py-4">
          <div className="grid grid-cols-3 gap-3">
            <StatCard label="Redemptions" value={summary?.redemptionCount ?? 0} />
            <StatCard label="Total discount given" value={`₹${(summary?.totalDiscountGiven ?? 0).toLocaleString('en-IN')}`} />
            <StatCard label="Refunded" value={summary?.refundedCount ?? 0} />
          </div>

          <div>
            <h3 className="mb-2 text-sm font-semibold text-heading">Recent redemptions</h3>
            {isRedemptionsLoading ? (
              <p className="text-sm text-muted-foreground">Loading...</p>
            ) : redemptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No redemptions yet.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {redemptions.map((r) => (
                  <div key={r.id} className="flex items-center justify-between rounded-lg border border-border p-2.5 text-sm">
                    <div className="flex flex-col">
                      <span className="font-medium text-heading">{r.customer?.name ?? 'Customer'}</span>
                      <span className="text-xs text-muted-foreground">
                        {r.order?.orderNumber ?? r.order} - {formatDate(r.redeemedAt)}
                      </span>
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="font-medium text-heading">₹{r.discountAmount.toLocaleString('en-IN')}</span>
                      <span className={`text-xs capitalize ${r.status === 'redeemed' ? 'text-success' : r.status === 'refunded' ? 'text-warning' : 'text-muted-foreground'}`}>
                        {r.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </Drawer>
  );
}
