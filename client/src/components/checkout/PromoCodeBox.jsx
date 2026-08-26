import { useState } from 'react';
import { Check, Tag, X } from 'lucide-react';
import { useApplyCoupon } from '@/features/storefront/storefrontApi';
import { useCartStore } from '@/store/cartStore';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { formatPrice } from '@/lib/format';
import { ReportProblemButton } from '@/components/support/ReportProblemButton';

// Real coupon validation (backend/src/modules/coupon) - "Apply" hits
// /storefront/coupons/apply and previews the actual discount this code
// would give against the cart's real items (product/variant/quantity, so
// scope rules like metal/category/collection can match); checkout()
// re-validates the same code server-side against the real order's items
// before it ever affects what's charged (storefront.service.js#checkout).
export function PromoCodeBox({ items, subtotal }) {
  const [code, setCode] = useState('');
  const appliedCoupon = useCartStore((s) => s.appliedCoupon);
  const setAppliedCoupon = useCartStore((s) => s.setAppliedCoupon);
  const clearAppliedCoupon = useCartStore((s) => s.clearAppliedCoupon);
  const applyCoupon = useApplyCoupon();

  const handleApply = () => {
    if (!code.trim()) return;
    applyCoupon.mutate(
      { code: code.trim(), items, subtotal },
      { onSuccess: (data) => setAppliedCoupon(data), onError: () => setAppliedCoupon(null) }
    );
  };

  if (appliedCoupon) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-xl bg-success/10 px-4 py-3 text-sm">
        <span className="flex min-w-0 items-center gap-2 text-success">
          <Check className="size-4 shrink-0" />
          <span className="truncate font-medium">
            "{appliedCoupon.code}" applied - you save {formatPrice(appliedCoupon.discountAmount)}
          </span>
        </span>
        <button
          type="button"
          onClick={() => {
            clearAppliedCoupon();
            setCode('');
            applyCoupon.reset();
          }}
          aria-label="Remove coupon"
          className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
        >
          <X className="size-4" />
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Tag className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            className="h-11 pl-10 uppercase"
            placeholder="Have a promo code?"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === 'Enter' && handleApply()}
          />
        </div>
        <Button type="button" variant="outline" className="h-11" loading={applyCoupon.isPending} onClick={handleApply}>
          Apply
        </Button>
      </div>
      {applyCoupon.isError && (
        <div className="mt-2 flex items-center justify-between gap-2">
          <p className="text-xs font-medium text-destructive">{applyCoupon.error.message}</p>
          <ReportProblemButton
            category="coupon"
            entityType="coupon"
            context={{ couponCode: code, cartSubtotal: subtotal, errorMessage: applyCoupon.error.message }}
            triggerLabel="Report issue"
            variant="ghost"
            className="h-auto shrink-0 p-0 text-xs text-muted-foreground underline-offset-2 hover:underline"
          />
        </div>
      )}
    </div>
  );
}
