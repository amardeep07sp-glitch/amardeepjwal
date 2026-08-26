import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CheckCircle2, Gem, MapPin, Package, Search, Truck } from 'lucide-react';
import { useTrackOrder } from '@/features/storefront/storefrontApi';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

const humanize = (value) => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const TRACKING_STEPS = [
  { key: 'confirmed', label: 'Confirmed', icon: CheckCircle2 },
  { key: 'packed', label: 'Packed', icon: Package },
  { key: 'shipped', label: 'Shipped', icon: Truck },
  { key: 'delivered', label: 'Delivered', icon: CheckCircle2 },
];
const STEP_ALIASES = { ready_to_ship: 'packed', partially_shipped: 'shipped', partially_delivered: 'delivered', completed: 'delivered' };

// A guest tracker with no login - proving order-number + phone ownership is
// this page's whole job, so the result stays intentionally thin (status,
// items, city/state) rather than the full address/contact a logged-in
// owner's own order-detail page shows (see storefront.service.js#trackOrder).
export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const trackOrder = useTrackOrder();

  const handleSubmit = (e) => {
    e.preventDefault();
    trackOrder.mutate({ orderNumber: orderNumber.trim(), phone: phone.trim() });
  };

  const result = trackOrder.data;
  const normalized = result ? (STEP_ALIASES[result.orderStatus] ?? result.orderStatus) : null;
  const currentIndex = TRACKING_STEPS.findIndex((s) => s.key === normalized);
  const isNonLinear = result && ['cancelled', 'returned', 'refunded'].includes(result.orderStatus);

  return (
    <PageContainer top="md" bottom="md">
      <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <BackButton />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Track Order' }]} />
      </div>

      <div className="mx-auto max-w-lg">
        <h1 className="mb-1 flex items-center gap-2.5 text-h3 font-display font-bold text-heading sm:text-h2">
          <Search className="size-6 text-primary" /> Track Your Order
        </h1>
        <p className="mb-6 text-sm text-muted-foreground">
          Enter your order number and the mobile number used at checkout to see its status - no login required.
        </p>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
          <div>
            <Label htmlFor="orderNumber" className="mb-1.5">Order Number</Label>
            <Input id="orderNumber" required placeholder="ORD-0000123" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} />
          </div>
          <div>
            <Label htmlFor="phone" className="mb-1.5">Mobile Number</Label>
            <Input id="phone" type="tel" required placeholder="10-digit mobile number" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          {trackOrder.isError && <p className="text-sm text-destructive">{trackOrder.error.message}</p>}
          <Button type="submit" variant="luxury" shape="pill" size="lg" loading={trackOrder.isPending}>
            Track Order
          </Button>
        </form>

        {result && (
          <div className="mt-6 rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
            <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
              <div>
                <p className="text-sm font-semibold text-heading">{result.orderNumber}</p>
                <p className="text-xs text-muted-foreground">
                  Placed on {new Date(result.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
              </div>
              <span className="text-sm font-semibold text-heading">{formatPrice(result.grandTotal)}</span>
            </div>

            {isNonLinear ? (
              <div className="rounded-xl bg-secondary/50 p-4 text-sm font-medium text-heading">
                Status: <span className="text-primary">{humanize(result.orderStatus)}</span>
              </div>
            ) : (
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
                            'flex size-8 shrink-0 items-center justify-center rounded-full transition-colors',
                            isDone ? 'bg-primary text-primary-foreground' : 'bg-secondary text-muted-foreground'
                          )}
                        >
                          <Icon className="size-4" />
                        </span>
                        {index < TRACKING_STEPS.length - 1 && (
                          <div className={cn('h-px flex-1 transition-colors', index < currentIndex ? 'bg-primary' : 'bg-border')} />
                        )}
                      </div>
                      <span className={cn('text-center text-[11px] font-medium', isDone ? 'text-heading' : 'text-muted-foreground')}>{step.label}</span>
                    </div>
                  );
                })}
              </div>
            )}

            {(result.deliveryCity || result.deliveryState) && (
              <p className="mt-4 flex items-center gap-1.5 text-sm text-muted-foreground">
                <MapPin className="size-3.5 text-primary" /> Delivering to {result.deliveryCity}{result.deliveryCity && result.deliveryState ? ', ' : ''}{result.deliveryState}
              </p>
            )}

            <div className="mt-4 divide-y divide-border border-t border-border">
              {result.items.map((item) => (
                <div key={item.id} className="flex items-center gap-3 py-3">
                  <div className="flex size-12 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary ring-1 ring-border">
                    {item.productSnapshot?.image ? (
                      <img src={item.productSnapshot.image} alt="" className="size-full object-cover" />
                    ) : (
                      <Gem className="size-4 text-primary/40" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm text-heading">{item.productSnapshot?.name}</p>
                    <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mt-4 text-center text-xs text-muted-foreground">
              Want full order details?{' '}
              <Link to="/login" className="font-medium text-primary hover:underline">
                Sign in
              </Link>{' '}
              to your account.
            </p>
          </div>
        )}
      </div>
    </PageContainer>
  );
}
