import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Gem, Heart, ShoppingBag } from 'lucide-react';
import { cn } from '@/lib/utils';
import { formatPrice } from '@/lib/format';
import { LOW_STOCK_THRESHOLD } from '@/config/appConfig';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

// List view's row - a fixed-size thumbnail, not ProductCard's full-width
// aspect-square image. Reusing ProductCard directly in a 1-column grid
// made its square image balloon to the full row width (and therefore
// height) once it wasn't confined to a grid column anymore - this is the
// dedicated, correctly-proportioned layout list view actually needs.
export function ProductListItem({ product }) {
  const [isWishlisted, setIsWishlisted] = useState(false);
  const { slug, name, shortDescription, category, price, image, inStock, stockQuantity } = product;
  const isLowStock = inStock && stockQuantity > 0 && stockQuantity <= LOW_STOCK_THRESHOLD;

  return (
    <div className="flex gap-4 rounded-lg bg-card p-3 ring-1 ring-border sm:gap-5 sm:p-4">
      <Link to={`/products/${slug}`} aria-label={name} className="relative size-28 shrink-0 overflow-hidden rounded-lg bg-secondary sm:size-36">
        {image ? (
          <img src={image.secureUrl} alt={image.altText || name} loading="lazy" className="size-full object-cover" />
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/10 via-secondary to-secondary">
            <Gem className="size-8 text-primary/40" strokeWidth={1.25} />
          </div>
        )}
      </Link>

      <div className="flex min-w-0 flex-1 flex-col gap-1.5">
        {category?.name && <span className="text-xs text-muted-foreground">{category.name}</span>}
        <Link to={`/products/${slug}`} className="font-nav line-clamp-1 text-sm font-light text-heading hover:text-primary sm:text-base">
          {name}
        </Link>
        {shortDescription && <p className="line-clamp-1 hidden text-sm text-muted-foreground sm:block">{shortDescription}</p>}

        <div className="flex items-baseline gap-2">
          <span className="text-base font-semibold text-heading">{formatPrice(price.finalPrice)}</span>
          {price.discountPercentage > 0 && (
            <>
              <span className="text-xs text-muted-foreground line-through">{formatPrice(price.mrp)}</span>
              <Badge className="h-4.5 px-1.5 text-[10px]">{price.discountPercentage}% OFF</Badge>
            </>
          )}
        </div>

        {!inStock ? (
          <Badge variant="destructive" className="w-fit">
            Out of Stock
          </Badge>
        ) : (
          isLowStock && (
            <Badge variant="warning" className="w-fit">
              Only {stockQuantity} left!
            </Badge>
          )
        )}

        <div className="mt-auto flex items-center gap-2 pt-1">
          <Button variant="outline" size="sm" className="gap-1.5" disabled={!inStock}>
            <ShoppingBag className="size-3.5" />
            <span className="hidden sm:inline">Add to Cart</span>
          </Button>
          <button
            type="button"
            onClick={() => setIsWishlisted((w) => !w)}
            aria-label={isWishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
            aria-pressed={isWishlisted}
            className={cn(
              'flex size-8 items-center justify-center rounded-full ring-1 ring-border transition-colors hover:text-primary',
              isWishlisted ? 'text-primary' : 'text-foreground'
            )}
          >
            <Heart className={cn('size-3.5', isWishlisted && 'fill-current')} />
          </button>
        </div>
      </div>
    </div>
  );
}
