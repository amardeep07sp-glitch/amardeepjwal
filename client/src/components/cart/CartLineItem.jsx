import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Gem, Minus, Plus, Trash2 } from 'lucide-react';
import { useProductBySlug } from '@/features/products/productsApi';
import { useCartStore } from '@/store/cartStore';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { formatPrice } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/config/appConfig';

// Re-fetches this one product live (real current price/stock) instead of
// trusting the cart's own stored snapshot - the snapshot is only ever a
// fallback while this is loading, never what gets shown once real data
// lands. The order itself is priced server-side regardless (see
// storefrontApi.js#useCheckout), so this is purely an honest-display
// concern, not a checkout-correctness one.
export function CartLineItem({ item }) {
  const { data: product, isLoading } = useProductBySlug(item.slug);
  const setQuantity = useCartStore((s) => s.setQuantity);
  const removeItem = useCartStore((s) => s.removeItem);

  const variant = item.variantId ? product?.variants?.find((v) => v.id === item.variantId) : null;
  const name = product?.name ?? item.name;
  const image = product?.image ?? item.image;
  const price = variant?.priceOverride ?? product?.price?.finalPrice ?? item.price;
  const mrp = product?.price?.mrp;
  const sku = variant?.sku ?? product?.sku;
  // Real per-item attribute pairs from the variant actually in the cart
  // (e.g. "18K Yellow Gold") - never invented purity/karat text.
  const attributeLine = variant?.attributes?.map((a) => a.value?.value).filter(Boolean).join(' · ');
  const inStock = variant ? variant.inStock : (product?.inStock ?? true);
  const stockQuantity = variant ? variant.stockQuantity : product?.stockQuantity;
  const isLowStock = inStock && stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD;
  const overStock = inStock && stockQuantity != null && item.quantity > stockQuantity;
  const lineTotal = price * item.quantity;

  const stepper = (
    <div className="flex items-center rounded-full ring-1 ring-border">
      <button
        type="button"
        onClick={() => setQuantity(item.productId, item.variantId, item.quantity - 1)}
        aria-label="Decrease quantity"
        className="flex size-8 items-center justify-center text-foreground transition-colors hover:text-primary"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-8 text-center text-sm font-medium text-heading">{item.quantity}</span>
      <button
        type="button"
        onClick={() => setQuantity(item.productId, item.variantId, item.quantity + 1)}
        aria-label="Increase quantity"
        disabled={stockQuantity != null && item.quantity >= stockQuantity}
        className="flex size-8 items-center justify-center text-foreground transition-colors hover:text-primary disabled:pointer-events-none disabled:opacity-30"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );

  const thumbnail = (
    <Link to={`/products/${item.slug}`} className="size-24 shrink-0 overflow-hidden rounded-xl bg-secondary ring-1 ring-border lg:size-20">
      {image ? (
        <img src={image.secureUrl} alt={image.altText || name} className="size-full object-cover" />
      ) : (
        <div className="flex size-full items-center justify-center">
          <Gem className="size-8 text-primary/40" />
        </div>
      )}
    </Link>
  );

  const identity = (
    <div className="min-w-0">
      <Link to={`/products/${item.slug}`} className="font-nav line-clamp-2 text-sm text-heading hover:text-primary sm:text-base">
        {name}
      </Link>
      <div className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
        {attributeLine && <span>{attributeLine}</span>}
        {sku && <span>SKU: {sku}</span>}
      </div>
      {product?.tags?.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1">
          {product.tags.slice(0, 2).map((tag) => (
            <Badge key={tag} variant="outline" className="text-[10px]">
              {tag}
            </Badge>
          ))}
        </div>
      )}
      {!inStock && <p className="mt-1 text-xs font-medium text-destructive">Out of stock</p>}
      {inStock && overStock && <p className="mt-1 text-xs font-medium text-warning">Only {stockQuantity} left - reduce quantity</p>}
      {inStock && !overStock && isLowStock && <p className="mt-1 text-xs font-medium text-warning">Only {stockQuantity} left</p>}
    </div>
  );

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, x: -24, transition: { duration: 0.2 } }}
      className="border-b border-border py-5 first:pt-0 last:border-b-0"
    >
      {/* Desktop: a real table row (PRODUCT | PRICE | QUANTITY | TOTAL),
          matching the reference layout's column grid. */}
      <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_120px_140px_120px] lg:items-center lg:gap-4">
        <div className="flex items-center gap-4">
          {thumbnail}
          {identity}
        </div>
        {isLoading ? (
          <Skeleton className="h-5 w-16" />
        ) : (
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-heading">{formatPrice(price)}</span>
            {mrp > price && <span className="text-xs text-muted-foreground line-through">{formatPrice(mrp)}</span>}
          </div>
        )}
        <div className="flex items-center justify-center">{stepper}</div>
        <div className="flex items-center justify-between gap-2">
          {isLoading ? <Skeleton className="h-5 w-16" /> : <span className="text-sm font-semibold text-heading">{formatPrice(lineTotal)}</span>}
          <button
            type="button"
            onClick={() => removeItem(item.productId, item.variantId)}
            aria-label="Remove from cart"
            className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      </div>

      {/* Tablet/mobile: stacked card. */}
      <div className="flex gap-4 lg:hidden">
        {thumbnail}
        <div className="flex min-w-0 flex-1 flex-col gap-1">
          <div className="flex items-start justify-between gap-3">
            {identity}
            <button
              type="button"
              onClick={() => removeItem(item.productId, item.variantId)}
              aria-label="Remove from cart"
              className="shrink-0 text-muted-foreground transition-colors hover:text-destructive"
            >
              <Trash2 className="size-4" />
            </button>
          </div>

          {isLoading ? (
            <Skeleton className="mt-1 h-5 w-20" />
          ) : (
            <div className="mt-1 flex items-baseline gap-2">
              <span className="text-sm font-semibold text-heading sm:text-base">{formatPrice(price)}</span>
              {mrp > price && <span className="text-xs text-muted-foreground line-through">{formatPrice(mrp)}</span>}
            </div>
          )}

          <div className="mt-1 flex items-center justify-between">
            {stepper}
            {!isLoading && <span className="text-sm font-semibold text-heading">{formatPrice(lineTotal)}</span>}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
