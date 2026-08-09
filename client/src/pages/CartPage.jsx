import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, BadgeCheck, CreditCard, Landmark, ShoppingBag, Smartphone, Truck, Undo2, Wallet } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useProductBySlug, useTrendingProducts } from '@/features/products/productsApi';
import { CartLineItem } from '@/components/cart/CartLineItem';
import { PromoCodeBox } from '@/components/checkout/PromoCodeBox';
import { PageContainer } from '@/components/global/PageContainer';
import { BackButton } from '@/components/global/BackButton';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { EmptyState } from '@/components/global/EmptyState';
import { ResponsiveGrid } from '@/components/global/ResponsiveGrid';
import { ProductCard } from '@/components/product';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';

const PAYMENT_METHODS = [
  { icon: Smartphone, label: 'UPI' },
  { icon: CreditCard, label: 'Cards' },
  { icon: Landmark, label: 'Netbanking' },
  { icon: Wallet, label: 'Cash on Delivery' },
];

const TRUST_STRIP = [
  { icon: Truck, label: 'Free Shipping' },
  { icon: Undo2, label: 'Easy 15-Day Returns' },
  { icon: BadgeCheck, label: 'Certified Jewellery' },
];

// Same Rules-of-Hooks-safe pattern as CheckoutPage's LivePriceReporter -
// its own component instance per cart item (via .map() below), each with
// one stable hook call, reporting the item's live finalPrice AND mrp up
// to the parent so the summary's subtotal and "you save" figure are both
// real, current numbers instead of a possibly-stale cart snapshot.
function CartPriceReporter({ item, onPrice }) {
  const { data: product } = useProductBySlug(item.slug);
  const variant = item.variantId ? product?.variants?.find((v) => v.id === item.variantId) : null;
  const unitPrice = variant?.priceOverride ?? product?.price?.finalPrice ?? item.price;
  const unitMrp = product?.price?.mrp ?? item.price;

  useEffect(() => {
    onPrice(item.productId, item.variantId, { total: unitPrice * item.quantity, mrpTotal: unitMrp * item.quantity });
    return () => onPrice(item.productId, item.variantId, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [unitPrice, unitMrp, item.productId, item.variantId, item.quantity]);

  return null;
}

export default function CartPage() {
  const items = useCartStore((s) => s.items);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const clearAppliedCoupon = useCartStore((s) => s.clearAppliedCoupon);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const { data: recommended } = useTrendingProducts(5);

  const [lineTotals, setLineTotals] = useState({});
  const handlePrice = useCallback((productId, variantId, value) => {
    setLineTotals((prev) => ({ ...prev, [`${productId}:${variantId ?? ''}`]: value }));
  }, []);

  const itemCount = useMemo(() => items.reduce((sum, i) => sum + i.quantity, 0), [items]);
  const { subtotal, mrpSubtotal } = useMemo(() => {
    return items.reduce(
      (acc, i) => {
        const key = `${i.productId}:${i.variantId ?? ''}`;
        const line = lineTotals[key];
        return {
          subtotal: acc.subtotal + (line?.total ?? i.price * i.quantity),
          mrpSubtotal: acc.mrpSubtotal + (line?.mrpTotal ?? i.price * i.quantity),
        };
      },
      { subtotal: 0, mrpSubtotal: 0 }
    );
  }, [items, lineTotals]);

  // A coupon applied against a since-changed subtotal (item removed,
  // quantity changed) is no longer trustworthy as a preview - drop it
  // rather than show a stale discount; checkout() would re-validate and
  // recompute it anyway, but showing the old number here would be a real
  // (if brief) lie about what the order will actually cost.
  useEffect(() => {
    if (appliedCoupon && items.length === 0) clearAppliedCoupon();
  }, [appliedCoupon, items.length, clearAppliedCoupon]);

  const couponDiscount = appliedCoupon?.discountAmount ?? 0;
  const mrpSavings = Math.max(0, mrpSubtotal - subtotal);
  const total = Math.max(0, subtotal - couponDiscount);

  const handleCheckout = () => {
    if (!isInitializing && !user) {
      navigate('/login');
      return;
    }
    navigate('/checkout');
  };

  return (
    <PageContainer top="sm" bottom="md">
      {items.map((item) => (
        <CartPriceReporter key={`${item.productId}:${item.variantId ?? ''}`} item={item} onPrice={handlePrice} />
      ))}

      <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <BackButton />
          <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Shopping Cart' }]} />
        </div>
        {items.length > 0 && (
          <span className="hidden items-center gap-1.5 rounded-full bg-success/10 px-3 py-1.5 text-xs font-semibold text-success sm:flex">
            <BadgeCheck className="size-3.5" /> 100% Secure Checkout
          </span>
        )}
      </div>

      <h1 className="mb-6 flex items-center gap-2.5 text-h3 font-display font-bold text-heading sm:text-h2">
        <ShoppingBag className="size-6 text-primary sm:size-7" />
        Shopping Cart
        {items.length > 0 && <span className="text-base font-normal text-muted-foreground">({itemCount} item{itemCount === 1 ? '' : 's'})</span>}
      </h1>

      {items.length === 0 ? (
        <EmptyState
          icon={ShoppingBag}
          title="Your cart is empty"
          description="Explore our collections and add pieces you love."
          actionLabel="Continue Shopping"
          onAction={() => navigate('/products')}
        />
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]"
        >
          <div className="min-w-0">
            <div className="rounded-2xl bg-card p-4 ring-1 ring-border sm:p-6">
              {/* Column header - desktop table only. */}
              <div className="mb-2 hidden grid-cols-[minmax(0,1fr)_120px_140px_120px] gap-4 border-b border-border pb-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase lg:grid">
                <span>Product</span>
                <span>Price</span>
                <span className="text-center">Quantity</span>
                <span>Total</span>
              </div>

              <AnimatePresence initial={false}>
                {items.map((item) => (
                  <CartLineItem key={`${item.productId}:${item.variantId ?? ''}`} item={item} />
                ))}
              </AnimatePresence>
            </div>

            <div className="mt-6 rounded-2xl bg-card p-4 ring-1 ring-border sm:p-6">
              <PromoCodeBox subtotal={subtotal} />
            </div>

            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3">
              {TRUST_STRIP.map(({ icon: Icon, label }) => (
                <span key={label} className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                  <Icon className="size-4 shrink-0 text-primary" /> {label}
                </span>
              ))}
            </div>
          </div>

          <div className="h-fit rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6 lg:sticky lg:top-24">
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-heading uppercase">Order Summary</h2>

            <div className="flex flex-col gap-2.5 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal ({itemCount} item{itemCount === 1 ? '' : 's'})</span>
                <span className="text-foreground">{formatPrice(subtotal)}</span>
              </div>
              {couponDiscount > 0 && (
                <div className="flex justify-between text-muted-foreground">
                  <span>Coupon ({appliedCoupon.code})</span>
                  <span className="font-medium text-success">-{formatPrice(couponDiscount)}</span>
                </div>
              )}
              <div className="flex justify-between text-muted-foreground">
                <span>Shipping</span>
                <span className="font-medium text-success">Free</span>
              </div>
            </div>

            <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
              <span className="text-base font-semibold text-heading">Total Amount</span>
              <span className="text-xl font-bold text-heading">{formatPrice(total)}</span>
            </div>
            <p className="mt-1 text-xs text-muted-foreground">Inclusive of all taxes</p>
            {mrpSavings + couponDiscount > 0 && (
              <p className="mt-2 text-sm font-medium text-success">You save {formatPrice(mrpSavings + couponDiscount)} on this order</p>
            )}

            <Button size="xl" variant="luxury" shape="pill" className="mt-5 w-full gap-2" onClick={handleCheckout}>
              Proceed to Checkout <ArrowRight className="size-4" />
            </Button>

            <div className="my-3 flex items-center gap-3">
              <span className="h-px flex-1 bg-border" />
              <span className="text-xs font-medium text-muted-foreground">OR</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            <Button size="xl" variant="outline" shape="pill" className="w-full" onClick={handleCheckout}>
              Buy Now
            </Button>

            <div className="mt-5 border-t border-border pt-4">
              <p className="mb-2 text-xs font-medium text-muted-foreground">We Accept</p>
              <div className="flex flex-wrap gap-2">
                {PAYMENT_METHODS.map(({ icon: Icon, label }) => (
                  <span key={label} className="flex items-center gap-1.5 rounded-full bg-secondary px-2.5 py-1.5 text-[11px] font-medium text-foreground">
                    <Icon className="size-3.5 text-primary" /> {label}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.div>
      )}

      {items.length > 0 && (
        <Link to="/products" className="mt-6 inline-flex items-center gap-1.5 text-sm font-medium text-primary hover:text-primary-hover">
          Continue Shopping
        </Link>
      )}

      {recommended?.length > 0 && (
        <div className="mt-12">
          <h2 className="mb-5 font-display text-h4 font-bold text-heading">You May Also Like</h2>
          <ResponsiveGrid count={recommended.length} className="gap-x-3 gap-y-6 sm:gap-x-4 sm:gap-y-8 xl:gap-x-6">
            {recommended.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </ResponsiveGrid>
        </div>
      )}
    </PageContainer>
  );
}
