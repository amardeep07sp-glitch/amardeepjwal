import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { BadgePercent, Check, Gem, Heart, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/config/appConfig';
import { Button } from '@/components/ui/button';
import { useCartStore } from '@/store/cartStore';
import { useAuthStore } from '@/store/authStore';
import { useMyWishlist, useAddToWishlist, useRemoveFromWishlist } from '@/features/storefront/storefrontApi';
import { track } from '@/lib/analytics';

// THE product card - reused by New Arrivals, category/search listing,
// "Similar Products", and anywhere else a product needs to show up as a
// tile. One component, one look, everywhere (per the site's theme-lock).
//
// Layout/proportions modeled on a real mobile jewellery-storefront PLP
// (square image, top-right wishlist, a stock-urgency strip, name, price,
// full-width Add to Cart) - colors/fonts stay ours (theme tokens, Inter),
// never the reference site's palette.
export function ProductCard({ product, className }) {
  const [justAdded, setJustAdded] = useState(false);
  const navigate = useNavigate();
  const user = useAuthStore((s) => s.user);
  const addItem = useCartStore((s) => s.addItem);
  const { data: wishlist } = useMyWishlist({ enabled: Boolean(user) });
  const addToWishlist = useAddToWishlist();
  const removeFromWishlist = useRemoveFromWishlist();
  const { id, slug, name, price, image, inStock, stockQuantity } = product;
  const isLowStock = inStock && stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD;
  const isWishlisted = wishlist?.some((row) => row.product?.id === id) ?? false;

  const handleToggleWishlist = () => {
    if (!user) {
      navigate('/login');
      return;
    }
    if (isWishlisted) {
      removeFromWishlist.mutate({ productId: id });
      track('wishlist_remove', { metadata: { productId: id } });
    } else {
      addToWishlist.mutate({ product: id });
      track('wishlist_add', { metadata: { productId: id } });
    }
  };

  const handleAddToCart = () => {
    addItem({ productId: id, slug, name, image: image?.secureUrl, price: price.finalPrice, quantity: 1 });
    track('add_to_cart', { metadata: { productId: id, quantity: 1, price: price.finalPrice } });
    setJustAdded(true);
    window.setTimeout(() => setJustAdded(false), 1600);
  };

  return (
    <div
      className={cn(
        'group/card flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_18px_35px_-15px_rgba(200,162,74,0.35)] hover:ring-primary/25',
        className
      )}
    >
      <div className="group relative aspect-square shrink-0 bg-secondary">
        <Link to={`/products/${slug}`} className="absolute inset-0" aria-label={name}>
          {image ? (
            <img
              src={image.secureUrl}
              alt={image.altText || name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.08]"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/10 via-secondary to-secondary">
              <Gem className="size-12 text-primary/40" strokeWidth={1.25} />
            </div>
          )}
        </Link>

        <button
          type="button"
          onClick={handleToggleWishlist}
          aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
          aria-pressed={isWishlisted}
          className={cn(
            'absolute top-2.5 right-2.5 flex size-7 items-center justify-center rounded-full bg-card shadow-sm transition-colors hover:text-primary',
            isWishlisted ? 'text-primary' : 'text-foreground'
          )}
        >
          <Heart className={cn('size-3.5', isWishlisted && 'fill-current')} />
        </button>

        {/* Urgency strip overlaid on the image itself (bottom edge), not a
            separate block between image and info - matches a real mobile
            jewellery-storefront PLP card exactly. */}
        {!inStock ? (
          <div className="absolute inset-x-0 bottom-0 bg-destructive py-1 text-center text-[10px] font-semibold tracking-wide text-white uppercase">
            Out of Stock
          </div>
        ) : (
          isLowStock && (
            <div className="absolute inset-x-0 bottom-0 bg-warning py-1 text-center text-[10px] font-semibold tracking-wide text-white uppercase">
              Only {stockQuantity} left!
            </div>
          )
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3">
        <Link
          to={`/products/${slug}`}
          className="font-nav line-clamp-1 text-sm font-light text-heading hover:text-primary"
        >
          {name}
        </Link>

        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-heading">{formatPrice(price.finalPrice)}</span>
          {price.discountPercentage > 0 && (
            <span className="text-xs text-muted-foreground line-through">{formatPrice(price.mrp)}</span>
          )}
        </div>

        {/* Real discount %, never a fabricated claim - no reviews/sold-count
            style invented numbers, and no borrowed "stone charges" wording
            since this catalog doesn't model that as a separate charge. */}
        {price.discountPercentage > 0 && (
          <p className="flex items-center gap-1 text-xs font-medium text-primary">
            <BadgePercent className="size-3.5 shrink-0" />
            {price.discountPercentage}% OFF
          </p>
        )}

        <Button
          variant="outline"
          className="mt-auto w-full gap-1.5 overflow-hidden text-xs uppercase"
          disabled={!inStock}
          onClick={handleAddToCart}
        >
          {justAdded ? <Check className="size-3.5 shrink-0" /> : <ShoppingBag className="size-3.5 shrink-0" />}
          <span className="truncate">{justAdded ? 'Added' : 'Add to Cart'}</span>
        </Button>
      </div>
    </div>
  );
}
