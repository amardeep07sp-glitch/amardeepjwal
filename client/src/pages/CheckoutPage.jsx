import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { CheckCircle2, ChevronLeft, CreditCard, Gem, MapPin, Truck, Wallet } from 'lucide-react';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useMyAddresses, useCheckout, useVerifyRazorpayPayment } from '@/features/storefront/storefrontApi';
import { useProductBySlug } from '@/features/products/productsApi';
import { CheckoutStepper } from '@/components/checkout/CheckoutStepper';
import { AddressForm } from '@/components/checkout/AddressForm';
import { PageContainer } from '@/components/global/PageContainer';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import { formatPrice } from '@/lib/format';
import { cn } from '@/lib/utils';
import { ReportProblemButton } from '@/components/support/ReportProblemButton';
import { GetSupportButton } from '@/components/support/GetSupportButton';

const STEP_ORDER = ['address', 'review', 'payment'];

// Reports one line's live price up to the parent's running total, instead
// of the parent calling useProductBySlug in a loop itself (which would
// call a different NUMBER of hooks every time the cart's item count
// changes - a real Rules-of-Hooks violation, not just a style nitpick).
// Each instance is its own component via the .map() below, so each gets
// its own single, stable hook call - the same pattern ReviewLine already
// uses to render, just reporting a number instead of markup.
function LivePriceReporter({ item, onPrice }) {
  const { data: product } = useProductBySlug(item.slug);
  const lineTotal = (product?.price?.finalPrice ?? item.price) * item.quantity;

  useEffect(() => {
    onPrice(item.productId, item.variantId, lineTotal);
    return () => onPrice(item.productId, item.variantId, undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lineTotal, item.productId, item.variantId]);

  return null;
}

function ReviewLine({ item }) {
  const { data: product, isLoading } = useProductBySlug(item.slug);
  const price = product?.price?.finalPrice ?? item.price;
  const image = product?.image ?? item.image;

  return (
    <div className="flex items-center gap-3 py-3">
      <div className="flex size-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary ring-1 ring-border">
        {image ? <img src={image.secureUrl} alt="" className="size-full object-cover" /> : <Gem className="size-5 text-primary/40" />}
      </div>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm text-heading">{product?.name ?? item.name}</p>
        <p className="text-xs text-muted-foreground">Qty {item.quantity}</p>
      </div>
      {isLoading ? <Skeleton className="h-4 w-16" /> : <span className="text-sm font-semibold text-heading">{formatPrice(price * item.quantity)}</span>}
    </div>
  );
}

export default function CheckoutPage() {
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const user = useAuthStore((s) => s.user);
  const isInitializing = useAuthStore((s) => s.isInitializing);
  const navigate = useNavigate();

  const [step, setStep] = useState('address');
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState('cod');
  const [checkoutError, setCheckoutError] = useState('');
  const [placedOrderNumber, setPlacedOrderNumber] = useState('');
  const [lineTotals, setLineTotals] = useState({});

  const handlePrice = useCallback((productId, variantId, total) => {
    setLineTotals((prev) => ({ ...prev, [`${productId}:${variantId ?? ''}`]: total }));
  }, []);

  const { data: addresses, isLoading: addressesLoading } = useMyAddresses();
  const checkoutMutation = useCheckout();
  const verifyPaymentMutation = useVerifyRazorpayPayment();

  // Not a shopper an unauthenticated tab should ever reach - AuthPage
  // itself redirects the other direction (see its own useEffect), this is
  // the checkout page's half of the same guard.
  useEffect(() => {
    if (!isInitializing && !user) navigate('/login', { replace: true });
  }, [isInitializing, user, navigate]);

  // An empty cart has nothing to check out - not a state this page can
  // render anything meaningful for, so it bounces back rather than
  // showing a broken empty order summary.
  useEffect(() => {
    if (items.length === 0 && !placedOrderNumber) navigate('/cart', { replace: true });
  }, [items.length, placedOrderNumber, navigate]);

  useEffect(() => {
    if (addresses?.length && !selectedAddressId) {
      setSelectedAddressId((addresses.find((a) => a.isDefaultShipping) ?? addresses[0]).id);
    }
  }, [addresses, selectedAddressId]);

  const pricesLoading = items.some((i) => lineTotals[`${i.productId}:${i.variantId ?? ''}`] === undefined);
  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + (lineTotals[`${i.productId}:${i.variantId ?? ''}`] ?? i.price * i.quantity), 0),
    [items, lineTotals]
  );
  const selectedAddress = addresses?.find((a) => a.id === selectedAddressId);

  const goToStep = (target) => {
    setCheckoutError('');
    setStep(target);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    const index = STEP_ORDER.indexOf(step);
    if (index > 0) goToStep(STEP_ORDER[index - 1]);
    else navigate('/cart');
  };

  const handlePlaceOrder = async () => {
    setCheckoutError('');
    const payload = {
      items: items.map((i) => ({ product: i.productId, variant: i.variantId || undefined, quantity: i.quantity })),
      shippingAddress: selectedAddressId,
      paymentMethod,
      couponCode: appliedCoupon?.code || undefined,
    };

    try {
      const result = await checkoutMutation.mutateAsync(payload);

      if (paymentMethod === 'cod') {
        // Real order, real fraud/risk guard (env.COD_MAX_ORDER_VALUE,
        // unset by default) - same "order exists, just needs payment
        // resolved another way" shape as the Razorpay initiation-failure
        // branch below, never a dead end.
        if (result.payment.status === 'cod_limit_exceeded') {
          clearCart();
          setPlacedOrderNumber(result.order.orderNumber);
          setCheckoutError(`Your order ${result.order.orderNumber} was placed. ${result.payment.error}`);
          return;
        }
        clearCart();
        // Straight to My Orders (not the order-confirmation page - that
        // route still exists and works, it's just no longer where checkout
        // itself lands) - `state` carries the order number for one success
        // banner there instead of losing that "it went through" feedback
        // entirely.
        navigate('/orders', { state: { placedOrderNumber: result.order.orderNumber } });
        return;
      }

      // Online payment (Razorpay) - DISABLED, see the payment-method radio
      // group above. paymentMethod can never actually be 'razorpay' right
      // now (UI only offers 'cod'), so this branch is dead in practice;
      // commented out anyway so there's zero chance of it firing against
      // an unconfigured gateway. Uncomment together with the radio option
      // once RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET are set (apikey.todo).
      /*
      // Razorpay - storefront.service.js still returns the real, already-
      // placed order even when gateway initiation itself failed
      // (payment.status === 'initiation_failed'), so that case is never a
      // dead end - the order exists, it's just unpaid.
      if (result.payment.status === 'initiation_failed') {
        clearCart();
        setPlacedOrderNumber(result.order.orderNumber);
        setCheckoutError(
          `Your order ${result.order.orderNumber} was placed, but online payment couldn't be started (${result.payment.error}). Please contact us to complete payment, or place a new order with Cash on Delivery.`
        );
        return;
      }

      const scriptLoaded = await loadRazorpayScript();
      if (!scriptLoaded) {
        setCheckoutError('Could not load the payment gateway. Please check your connection and try again.');
        return;
      }

      const razorpay = new window.Razorpay({
        key: import.meta.env.VITE_RAZORPAY_KEY_ID,
        amount: Math.round(result.payment.amount * 100),
        currency: result.payment.currency,
        order_id: result.payment.razorpayOrderId,
        name: APP_NAME,
        description: `Order ${result.order.orderNumber}`,
        handler: async (response) => {
          try {
            await verifyPaymentMutation.mutateAsync({
              orderId: result.order.id,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            clearCart();
            navigate('/orders', { state: { placedOrderNumber: result.order.orderNumber } });
          } catch (err) {
            setCheckoutError(`Payment succeeded but verification failed: ${err.message}. Please contact us with order ${result.order.orderNumber}.`);
          }
        },
        modal: {
          // The order (confirmed, stock reserved) already exists - closing
          // the payment popup just leaves it unpaid, not lost.
          ondismiss: () => setCheckoutError(`Payment cancelled. Your order ${result.order.orderNumber} is saved - you can retry payment from My Orders.`),
        },
        theme: { color: '#C8A24D' },
      });
      razorpay.open();
      */
    } catch (err) {
      setCheckoutError(err.message || 'Something went wrong placing your order.');
    }
  };

  if (items.length === 0 && !placedOrderNumber) return null;

  return (
    <PageContainer top="sm" bottom="md">
      {items.map((item) => (
        <LivePriceReporter key={`${item.productId}:${item.variantId ?? ''}`} item={item} onPrice={handlePrice} />
      ))}

      <div className="mb-6 flex items-center gap-3">
        <button
          type="button"
          onClick={handleBack}
          aria-label="Back"
          className="flex size-9 shrink-0 items-center justify-center rounded-full ring-1 ring-border transition-colors hover:bg-muted"
        >
          <ChevronLeft className="size-4.5" />
        </button>
        <h1 className="font-display text-h3 font-bold text-heading sm:text-h2">Checkout</h1>
      </div>

      <div className="mb-8">
        <CheckoutStepper currentStep={step} />
      </div>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <AnimatePresence mode="wait">
            <motion.div
              key={step}
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -16 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
            >
              {step === 'address' && (
                <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide text-heading uppercase">
                    <MapPin className="size-4 text-primary" /> Delivery Address
                  </h2>

                  {addressesLoading ? (
                    <div className="flex flex-col gap-3">
                      {Array.from({ length: 2 }).map((_, i) => (
                        <Skeleton key={i} className="h-24 w-full rounded-xl" />
                      ))}
                    </div>
                  ) : (
                    <RadioGroup value={selectedAddressId ?? ''} onValueChange={setSelectedAddressId} className="gap-3">
                      {(addresses ?? []).map((addr) => (
                        <Label
                          key={addr.id}
                          htmlFor={`addr-${addr.id}`}
                          className={cn(
                            'flex cursor-pointer items-start gap-3 rounded-xl p-4 ring-1 transition-colors',
                            selectedAddressId === addr.id ? 'bg-primary/5 ring-primary' : 'ring-border hover:bg-muted/50'
                          )}
                        >
                          <RadioGroupItem value={addr.id} id={`addr-${addr.id}`} className="mt-1" />
                          <span className="min-w-0 flex-1 text-sm">
                            <span className="flex items-center gap-2">
                              <span className="font-semibold text-heading">{addr.label || 'Address'}</span>
                              {addr.isDefaultShipping && (
                                <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-semibold text-primary uppercase">Default</span>
                              )}
                            </span>
                            <span className="mt-0.5 block text-muted-foreground">
                              {addr.line1}
                              {addr.line2 ? `, ${addr.line2}` : ''}, {addr.city}, {addr.state} {addr.postalCode}
                            </span>
                            <span className="mt-0.5 block text-muted-foreground">Phone: {addr.phone}</span>
                          </span>
                        </Label>
                      ))}
                    </RadioGroup>
                  )}

                  {!showAddressForm ? (
                    <Button type="button" variant="outline" className="mt-4" onClick={() => setShowAddressForm(true)}>
                      + Add New Address
                    </Button>
                  ) : (
                    <div className="mt-4">
                      <AddressForm
                        onCancel={() => setShowAddressForm(false)}
                        onSuccess={(saved) => {
                          setSelectedAddressId(saved.id);
                          setShowAddressForm(false);
                        }}
                      />
                    </div>
                  )}

                  <Button
                    size="xl"
                    variant="luxury"
                    shape="pill"
                    className="mt-6 w-full"
                    disabled={!selectedAddressId}
                    onClick={() => goToStep('review')}
                  >
                    Deliver to this Address
                  </Button>
                </div>
              )}

              {step === 'review' && (
                <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
                  <h2 className="mb-1 flex items-center gap-2 text-sm font-semibold tracking-wide text-heading uppercase">
                    <Truck className="size-4 text-primary" /> Order Review
                  </h2>
                  {selectedAddress && (
                    <p className="mb-4 text-sm text-muted-foreground">
                      Delivering to {selectedAddress.line1}, {selectedAddress.city} - {selectedAddress.postalCode}
                    </p>
                  )}

                  <div className="divide-y divide-border border-t border-border">
                    {items.map((item) => (
                      <ReviewLine key={`${item.productId}:${item.variantId ?? ''}`} item={item} />
                    ))}
                  </div>

                  <Button size="xl" variant="luxury" shape="pill" className="mt-6 w-full" onClick={() => goToStep('payment')}>
                    Continue to Payment
                  </Button>
                </div>
              )}

              {step === 'payment' && (
                <div className="rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6">
                  <h2 className="mb-4 flex items-center gap-2 text-sm font-semibold tracking-wide text-heading uppercase">
                    <CreditCard className="size-4 text-primary" /> Payment Method
                  </h2>

                  <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod} className="gap-3">
                    <Label
                      htmlFor="pay-cod"
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl p-4 ring-1 transition-colors',
                        paymentMethod === 'cod' ? 'bg-primary/5 ring-primary' : 'ring-border hover:bg-muted/50'
                      )}
                    >
                      <RadioGroupItem value="cod" id="pay-cod" />
                      <Wallet className="size-4.5 text-primary" />
                      <span className="flex-1 text-sm">
                        <span className="block font-semibold text-heading">Cash on Delivery</span>
                        <span className="block text-xs text-muted-foreground">Pay when your order arrives</span>
                      </span>
                    </Label>
                    {/* Online payment (Razorpay) - DISABLED until real
                        RAZORPAY_KEY_ID/SECRET/WEBHOOK_SECRET are set in
                        production (see apikey.todo). The handling code
                        below in handlePlaceOrder is commented out too -
                        uncomment both together to re-enable. COD-only is a
                        safe launch default; nothing about checkout itself
                        is broken by this, it just has one payment method. */}
                    {/* <Label
                      htmlFor="pay-razorpay"
                      className={cn(
                        'flex cursor-pointer items-center gap-3 rounded-xl p-4 ring-1 transition-colors',
                        paymentMethod === 'razorpay' ? 'bg-primary/5 ring-primary' : 'ring-border hover:bg-muted/50'
                      )}
                    >
                      <RadioGroupItem value="razorpay" id="pay-razorpay" />
                      <CreditCard className="size-4.5 text-primary" />
                      <span className="flex-1 text-sm">
                        <span className="block font-semibold text-heading">Pay Online</span>
                        <span className="block text-xs text-muted-foreground">UPI, Cards, Netbanking via Razorpay</span>
                      </span>
                    </Label> */}
                  </RadioGroup>

                  {checkoutError && (
                    <div className="mt-4 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
                      <p>{checkoutError}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <ReportProblemButton
                          category="payment"
                          entityType="checkout"
                          context={{ errorMessage: checkoutError, paymentMethod, cartTotal: subtotal }}
                          triggerLabel="Report this issue"
                          variant="outline"
                          className="border-destructive/30 text-destructive hover:bg-destructive/10"
                        />
                        <GetSupportButton category="payment" context={{ extra: { errorMessage: checkoutError } }} triggerLabel="Get Help" variant="outline" />
                      </div>
                    </div>
                  )}

                  <Button
                    size="xl"
                    variant="luxury"
                    shape="pill"
                    className="mt-6 w-full"
                    loading={checkoutMutation.isPending || verifyPaymentMutation.isPending}
                    onClick={handlePlaceOrder}
                  >
                    Place Order
                  </Button>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="h-fit rounded-2xl bg-card p-5 ring-1 ring-border sm:p-6 lg:sticky lg:top-24">
          <h2 className="mb-4 text-sm font-semibold tracking-wide text-heading uppercase">Order Summary</h2>
          <div className="flex justify-between text-sm text-muted-foreground">
            <span>Subtotal</span>
            {pricesLoading ? <Skeleton className="h-4 w-16" /> : <span className="text-foreground">{formatPrice(subtotal)}</span>}
          </div>
          {appliedCoupon && (
            <div className="mt-2 flex justify-between text-sm text-muted-foreground">
              <span>Coupon ({appliedCoupon.code})</span>
              <span className="font-medium text-success">-{formatPrice(appliedCoupon.discountAmount)}</span>
            </div>
          )}
          <div className="mt-2 flex justify-between text-sm text-muted-foreground">
            <span>Shipping</span>
            <span className="font-medium text-success">Free</span>
          </div>
          <div className="mt-4 flex items-baseline justify-between border-t border-border pt-4">
            <span className="text-base font-semibold text-heading">Total</span>
            {pricesLoading ? (
              <Skeleton className="h-6 w-20" />
            ) : (
              <span className="text-xl font-bold text-heading">
                {formatPrice(Math.max(0, subtotal - (appliedCoupon?.discountAmount ?? 0)))}
              </span>
            )}
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-muted-foreground">
            <CheckCircle2 className="size-4 shrink-0 text-primary" /> {items.length} item{items.length === 1 ? '' : 's'} ready for checkout
          </p>
        </div>
      </div>
    </PageContainer>
  );
}
