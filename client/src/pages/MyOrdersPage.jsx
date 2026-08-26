import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CreditCard, Gem, Package, RotateCw, Wallet } from 'lucide-react';
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

// Real statuses only (order.constants.js) - no "Placed"/"Out for Delivery"
// tab, since neither is a distinct status this backend's order lifecycle
// actually has (a placed order goes straight to "confirmed"; there's no
// granular out-for-delivery step between shipped and delivered).
const STATUS_TABS = [
  { label: 'All', value: undefined },
  { label: 'Confirmed', value: 'confirmed' },
  { label: 'Shipped', value: 'shipped' },
  { label: 'Delivered', value: 'delivered' },
  { label: 'Cancelled', value: 'cancelled' },
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
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const [statusFilter, setStatusFilter] = useState(undefined);
  const [page, setPage] = useState(1);
  const [buyAgainState, setBuyAgainState] = useState({ orderId: null, status: 'idle' });
  const { data, isLoading, isError, error, refetch } = useMyOrders({ page, limit: 10, orderStatus: statusFilter });

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

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
      {/* Smaller + outlined vs. AccountMobileNav's pills right above (same
          page, different job - that's account section navigation, this is
          an in-page filter) so the two rows don't blend into one another. */}
      <div className="scrollbar-none mb-5 flex items-center gap-1.5 overflow-x-auto pb-0.5">
        {STATUS_TABS.map((tab) => (
          <button
            key={tab.label}
            type="button"
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={cn(
              'shrink-0 rounded-full px-3 py-1 text-xs font-medium transition-colors',
              statusFilter === tab.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-card text-muted-foreground ring-1 ring-border hover:text-foreground'
            )}
          >
            {tab.label}
          </button>
        ))}
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
