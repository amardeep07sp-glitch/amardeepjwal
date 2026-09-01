import { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, CreditCard, Gem, Package, RotateCw, Wallet, X } from 'lucide-react';
import { useMyOrders } from '@/features/storefront/storefrontApi';
import { useAuthStore } from '@/store/authStore';
import { buyOrderAgain } from '@/lib/buyAgain';
import { AccountLayout } from '@/components/account/AccountLayout';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { Pagination } from '@/components/global/Pagination';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';

const STATUS_STYLE = {
  confirmed: 'bg-primary/10 text-primary',
  packed: 'bg-info/10 text-info',
  ready_to_ship: 'bg-info/10 text-info',
  shipped: 'bg-info/10 text-info',
  partially_shipped: 'bg-info/10 text-info',
  delivered: 'bg-success/10 text-success',
  partially_delivered: 'bg-success/10 text-success',
  completed: 'bg-success/10 text-success',
  cancelled: 'bg-destructive/10 text-destructive',
  returned: 'bg-destructive/10 text-destructive',
  refunded: 'bg-destructive/10 text-destructive',
  pending: 'bg-warning/10 text-warning',
  draft: 'bg-muted text-muted-foreground',
};

// Buyer-facing status buckets, not a 1:1 tab-per-raw-status list - a
// customer filtering "Shipped" wants every order actually in transit
// (packed/ready_to_ship/shipped/partially_shipped are all "it's on its way"
// from their side of the counter), not just the ones whose orderStatus
// string happens to be the exact word "shipped". Same idea for "Delivered"
// (partially_delivered/completed both mean "it arrived") and "Cancelled"
// (a return or refund is a cancellation outcome too). Adding a new raw
// backend status later means adding it to the right bucket here - never a
// new tab, new state, or new case anywhere else on this page.
const STATUS_TABS = [
  { key: 'all', label: 'All', statuses: undefined },
  { key: 'confirmed', label: 'Confirmed', statuses: ['confirmed'] },
  { key: 'shipped', label: 'Shipped', statuses: ['packed', 'ready_to_ship', 'shipped', 'partially_shipped'] },
  { key: 'delivered', label: 'Delivered', statuses: ['delivered', 'partially_delivered', 'completed'] },
  { key: 'cancelled', label: 'Cancelled', statuses: ['cancelled', 'returned', 'refunded'] },
];

const PAYMENT_METHOD_LABEL = { cod: 'Cash on Delivery', razorpay: 'Online Payment' };
const PAYMENT_METHOD_ICON = { cod: Wallet, razorpay: CreditCard };

const humanize = (value) => value.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

function OrderRow({ order, index, onBuyAgain, buyAgainState }) {
  const PaymentIcon = PAYMENT_METHOD_ICON[order.paymentMethod] ?? Wallet;
  const isBuyingAgain = buyAgainState.orderId === order.id && buyAgainState.status === 'pending';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
      className="rounded-2xl bg-card p-4 ring-1 ring-border sm:p-5"
    >
      <Link to={`/orders/${order.id}`} className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Package className="size-5" />
          </span>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-heading">{order.orderNumber}</p>
            <p className="text-xs text-muted-foreground">
              Placed on {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
            </p>
            {order.paymentMethod && (
              <p className="mt-0.5 flex items-center gap-1 text-xs text-muted-foreground">
                <PaymentIcon className="size-3" /> {PAYMENT_METHOD_LABEL[order.paymentMethod] ?? order.paymentMethod}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center justify-between gap-4 sm:justify-end">
          <span className="text-sm font-semibold text-heading">{formatPrice(order.grandTotal)}</span>
          <span
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-semibold uppercase',
              STATUS_STYLE[order.orderStatus] ?? 'bg-muted text-muted-foreground'
            )}
          >
            {humanize(order.orderStatus)}
          </span>
        </div>
      </Link>

      <div className="mt-3 flex items-center justify-between gap-3 border-t border-border pt-3">
        <Link to={`/orders/${order.id}`} className="text-sm font-medium text-primary hover:text-primary-hover">
          View Details
        </Link>
        {['delivered', 'partially_delivered', 'completed', 'cancelled'].includes(order.orderStatus) && (
          <button
            type="button"
            onClick={() => onBuyAgain(order.id)}
            disabled={isBuyingAgain}
            className="flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover disabled:opacity-60"
          >
            <RotateCw className={cn('size-3.5', isBuyingAgain && 'animate-spin')} /> {isBuyingAgain ? 'Adding...' : 'Buy Again'}
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default function MyOrdersPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const [activeTabKey, setActiveTabKey] = useState('all');
  const [page, setPage] = useState(1);
  const [buyAgainState, setBuyAgainState] = useState({ orderId: null, status: 'idle' });
  // Checkout now lands here directly instead of a separate order-
  // confirmation page (CheckoutPage.jsx#handlePlaceOrder) - this is the one
  // place that "your order went through" feedback still shows, read once
  // from router state so it survives the redirect but not a later refresh
  // of this same page.
  const [placedOrderNumber, setPlacedOrderNumber] = useState(location.state?.placedOrderNumber ?? null);
  const activeTab = STATUS_TABS.find((tab) => tab.key === activeTabKey) ?? STATUS_TABS[0];
  const { data, isLoading, isError, error, refetch } = useMyOrders({ page, limit: 10, orderStatus: activeTab.statuses });

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  useEffect(() => {
    if (location.state?.placedOrderNumber) navigate(location.pathname, { replace: true, state: {} });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleBuyAgain = async (orderId) => {
    setBuyAgainState({ orderId, status: 'pending' });
    try {
      const { added, skipped } = await buyOrderAgain(orderId);
      if (added === 0) {
        setBuyAgainState({ orderId, status: 'error', message: 'These items are no longer available to re-order.' });
        return;
      }
      navigate('/cart', { state: { buyAgainSkipped: skipped } });
    } catch (err) {
      setBuyAgainState({ orderId, status: 'error', message: err.message });
    }
  };

  if (isInitializing || !user) return null;

  return (
    <AccountLayout title="My Orders" subtitle="Track, return, or buy items again" icon={Package} breadcrumbLabel="My Orders">
      {placedOrderNumber && (
        <div className="mb-5 flex items-start gap-3 rounded-2xl bg-success/10 p-4 ring-1 ring-success/30">
          <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-success" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-heading">Order placed successfully!</p>
            <p className="text-xs text-muted-foreground">
              Your order <span className="font-medium text-heading">{placedOrderNumber}</span> has been confirmed.
            </p>
          </div>
          <button
            type="button"
            onClick={() => setPlacedOrderNumber(null)}
            aria-label="Dismiss"
            className="shrink-0 rounded-full p-1 text-muted-foreground hover:bg-success/15 hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>
      )}

      {/* The trailing gradient hints there's more to scroll past the edge
          on mobile, instead of the row just looking cut off mid-label. */}
      <div className="relative mb-5">
        <div className="scrollbar-none flex items-center gap-2 overflow-x-auto pb-0.5">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key}
              type="button"
              onClick={() => {
                setActiveTabKey(tab.key);
                setPage(1);
              }}
              aria-pressed={activeTabKey === tab.key}
              className={cn(
                'shrink-0 rounded-full px-3.5 py-1.5 text-xs font-medium whitespace-nowrap transition-colors',
                activeTabKey === tab.key
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-card text-muted-foreground ring-1 ring-border hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-linear-to-l from-background to-transparent" />
      </div>

      {buyAgainState.status === 'error' && (
        <p className="mb-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{buyAgainState.message}</p>
      )}

      {isError ? (
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      ) : isLoading ? (
        <div className="flex flex-col gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      ) : data.items.length === 0 ? (
        <EmptyState
          icon={Gem}
          title="No orders yet"
          description="When you place an order, it will show up here."
          actionLabel="Start Shopping"
          onAction={() => navigate('/products')}
        />
      ) : (
        <>
          <div className="flex flex-col gap-3">
            {data.items.map((order, index) => (
              <OrderRow key={order.id} order={order} index={index} onBuyAgain={handleBuyAgain} buyAgainState={buyAgainState} />
            ))}
          </div>
          <div className="mt-6">
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} totalItems={data.meta.totalItems} onPageChange={setPage} />
          </div>
        </>
      )}
    </AccountLayout>
  );
}
