import { useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { CheckCircle2, Gem, MapPin, Package } from 'lucide-react';
import { useMyOrder } from '@/features/storefront/storefrontApi';
import { useAuthStore } from '@/store/authStore';
import { PageContainer } from '@/components/global/PageContainer';
import { ErrorState } from '@/components/global/ErrorState';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';

const ORDER_STATUS_LABEL = {
  draft: 'Draft',
  pending: 'Pending',
  confirmed: 'Confirmed',
  packed: 'Packed',
  ready_to_ship: 'Ready to Ship',
  shipped: 'Shipped',
  partially_shipped: 'Partially Shipped',
  delivered: 'Delivered',
  partially_delivered: 'Partially Delivered',
  completed: 'Completed',
  cancelled: 'Cancelled',
  returned: 'Returned',
  refunded: 'Refunded',
};

export default function OrderConfirmationPage() {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { data, isLoading, isError, error, refetch } = useMyOrder(orderId);

  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  if (isInitializing || !user) return null;

  if (isLoading) {
    return (
      <PageContainer top="md" bottom="md">
        <div className="mx-auto flex max-w-lg flex-col items-center gap-4">
          <Skeleton className="size-16 rounded-full" />
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-40 w-full rounded-2xl" />
        </div>
      </PageContainer>
    );
  }

  if (isError) {
    return (
      <PageContainer top="md" bottom="md">
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      </PageContainer>
    );
  }

  const { order, items } = data;

  return (
    <PageContainer top="md" bottom="md">
      <div className="mx-auto flex max-w-lg flex-col items-center text-center">
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 18 }}
          className="flex size-20 items-center justify-center rounded-full bg-success/10 text-success"
        >
          <CheckCircle2 className="size-11" strokeWidth={1.5} />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15, duration: 0.4 }}>
          <h1 className="mt-5 font-display text-h3 font-bold text-heading sm:text-h2">Order Placed!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Thank you - your order <span className="font-semibold text-heading">{order.orderNumber}</span> has been{' '}
            {order.paymentStatus === 'paid' ? 'confirmed and paid' : 'confirmed'}.
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25, duration: 0.4 }}
          className="mt-8 w-full rounded-2xl bg-card p-5 text-left ring-1 ring-border sm:p-6"
        >
          <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-4">
            <div>
              <p className="text-xs text-muted-foreground">Order Number</p>
              <p className="text-sm font-semibold text-heading">{order.orderNumber}</p>
            </div>
            <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary uppercase">
              {ORDER_STATUS_LABEL[order.orderStatus] ?? order.orderStatus}
            </span>
          </div>

          <div className="divide-y divide-border">
            {items.map((item) => (
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
                <span className="text-sm font-semibold text-heading">{formatPrice(item.total)}</span>
              </div>
            ))}
          </div>

          <div className="mt-2 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-sm font-semibold text-heading">Total Paid</span>
            <span className="text-lg font-bold text-heading">{formatPrice(order.grandTotal)}</span>
          </div>

          {order.shippingAddressSnapshot && (
            <div className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-sm text-muted-foreground">
              <MapPin className="mt-0.5 size-4 shrink-0 text-primary" />
              <span>
                {order.shippingAddressSnapshot.line1}, {order.shippingAddressSnapshot.city}, {order.shippingAddressSnapshot.state}{' '}
                {order.shippingAddressSnapshot.postalCode}
              </span>
            </div>
          )}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex w-full flex-col gap-3 sm:flex-row"
        >
          <Button asChild variant="outline" className="flex-1">
            <Link to="/orders">
              <Package className="size-4" /> View My Orders
            </Link>
          </Button>
          <Button asChild variant="luxury" shape="pill" className="flex-1">
            <Link to="/products">Continue Shopping</Link>
          </Button>
        </motion.div>
      </div>
    </PageContainer>
  );
}
