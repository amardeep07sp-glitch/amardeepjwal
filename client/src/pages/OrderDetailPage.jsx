import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { CheckCircle2, Download, Gem, MapPin, Package, Truck } from 'lucide-react';
import { useMyOrder } from '@/features/storefront/storefrontApi';
import { useAuthStore } from '@/store/authStore';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { ErrorState } from '@/components/global/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import { downloadFile } from '@/lib/downloadFile';
import { cn } from '@/lib/utils';

// The real fulfillment path an order actually walks (order.statusTransition.js)
// - a returned/cancelled/refunded order is shown as its own distinct,
// non-linear state below instead of forced onto this line.
const TRACKING_STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];

const STEP_ALIASES = {
  ready_to_ship: 'packed',
  partially_shipped: 'shipped',
  partially_delivered: 'delivered',
  completed: 'delivered',
};

const humanize = (value) => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function OrderTracking({ status }) {
  const normalized = STEP_ALIASES[status] ?? status;
  const currentIndex = TRACKING_STEPS.findIndex((s) => s.key === normalized);

  if (['cancelled', 'returned', 'refunded', 'draft', 'pending'].includes(status)) {
    return (
      <div className="rounded-xl bg-secondary/50 p-4 text-sm font-medium text-heading">
        Status: <span className="text-primary">{humanize(status)}</span>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-between">
      {TRACKING_STEPS.map((step, index) => {
        const isDone = index <= currentIndex;
        const Icon = step.icon;
        return (
          <div key={step.key} className="flex flex-1 flex-col items-center gap-1.5 last:flex-none">
            <div className="flex w-full items-center">
              {index > 0 && <div className={cn('h-px flex-1 transition-colors', isDone ? 'bg-primary' : 'bg-border')} />}
              <span
                className={cn(
                  'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors sm:size-9',
                  isDone ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                )}
              >
                <Icon className="size-4" />
              </span>
              {index < TRACKING_STEPS.length - 1 && <div className={cn('h-px flex-1 transition-colors', index < currentIndex ? 'bg-primary' : 'bg-border')} />}
            </div>
            <span className={cn('text-center text-[11px] font-medium sm:text-xs', isDone ? 'text-heading' : 'text-muted-foreground')}>{step.label}</span>
          </div>
        );
      })}
    </div>
  );
}

export default function OrderDetailPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { data, isLoading, isError, error, refetch } = useMyOrder(orderId);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadError, setDownloadError] = useState('');

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  const handleDownloadInvoice = async () => {
    setDownloadError('');
    setIsDownloading(true);
    try {
      await downloadFile(`/storefront/orders/${orderId}/invoice`, { filename: `invoice-${data.order.orderNumber}.pdf` });
    } catch (err) {
      setDownloadError(err.message);
    } finally {
      setIsDownloading(false);
    }
  };

  if (isInitializing || !user) return null;

  return (
    <PageContainer top="sm" bottom="md">
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <BackButton fallbackPath="/orders" />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'My Orders', to: '/orders' }, { label: data?.order.orderNumber ?? 'Order' }]} />
      </div>

      {isError ? (
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-24 w-full rounded-2xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
        </div>
      ) : (
        <>
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
            <div>
              <h1 className="text-h3 font-display font-bold text-heading sm:text-h2">{data.order.orderNumber}</h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Placed on {new Date(data.order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary uppercase">
                Payment: {humanize(data.order.paymentStatus)}
              </span>
              <Button variant="outline" size="sm" loading={isDownloading} onClick={handleDownloadInvoice}>
                <Download className="size-3.5" /> Download Invoice
              </Button>
            </div>
          </div>

          {downloadError && <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{downloadError}</p>}

          <div className="mb-6 rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
            <OrderTracking status={data.order.orderStatus} />
          </div>

          <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
            <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
              <h2 className="mb-3 text-sm font-semibold tracking-wide text-heading uppercase">Items</h2>
              <div className="divide-y divide-border">
                {data.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-3 py-3">
                    <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary ring-1 ring-border">
                      {item.productSnapshot?.image ? (
                        <img src={item.productSnapshot.image} alt="" className="size-full object-cover" />
                      ) : (
                        <Gem className="size-5 text-primary/40" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm text-heading">{item.productSnapshot?.name}</p>
                      <p className="text-xs text-muted-foreground">Qty {item.quantity} &times; {formatPrice(item.unitPrice)}</p>
                    </div>
                    <span className="text-sm font-semibold text-heading">{formatPrice(item.total)}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-6">
              {data.order.shippingAddressSnapshot && (
                <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
                  <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold tracking-wide text-heading uppercase">
                    <MapPin className="size-4 text-primary" /> Delivery Address
                  </h2>
                  <p className="text-sm text-muted-foreground">
                    {data.order.shippingAddressSnapshot.line1}
                    {data.order.shippingAddressSnapshot.line2 ? `, ${data.order.shippingAddressSnapshot.line2}` : ''}
                    <br />
                    {data.order.shippingAddressSnapshot.city}, {data.order.shippingAddressSnapshot.state} {data.order.shippingAddressSnapshot.postalCode}
                    <br />
                    Phone: {data.order.shippingAddressSnapshot.phone}
                  </p>
                </div>
              )}

              <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
                <h2 className="mb-3 text-sm font-semibold tracking-wide text-heading uppercase">Price Details</h2>
                <div className="flex flex-col gap-2 text-sm">
                  <div className="flex justify-between text-muted-foreground">
                    <span>Subtotal</span>
                    <span className="text-foreground">{formatPrice(data.order.subtotal)}</span>
                  </div>
                  {data.order.discount > 0 && (
                    <div className="flex justify-between text-muted-foreground">
                      <span>Discount</span>
                      <span className="text-success">-{formatPrice(data.order.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between text-muted-foreground">
                    <span>Shipping</span>
                    <span className="font-medium text-success">Free</span>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-border pt-2 text-base font-semibold text-heading">
                    <span>Total</span>
                    <span>{formatPrice(data.order.grandTotal)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </PageContainer>
  );
}
