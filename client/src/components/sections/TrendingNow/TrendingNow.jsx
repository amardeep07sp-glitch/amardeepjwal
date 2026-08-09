import { Link } from 'react-router-dom';
import { Gem } from 'lucide-react';
import { useTrendingProducts } from '@/features/products/productsApi';
import { ErrorState } from '@/components/global/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';

const TILE_COUNT = 3;

// An editorial "campaign" tile, not a ProductCard - no price, no Add to
// Cart, just a big real product photo and its real name underneath (the
// tanishq.co.in "Trending Now" reference this mirrors is deliberately
// quieter than a shopping grid). Still a real product link though - it
// goes to the exact same /products/:slug PDP a search result would, so
// "trending" is never a dead end separate from the real catalog.
function TrendingTile({ product }) {
  return (
    <Link to={`/products/${product.slug}`} className="group flex flex-col items-center gap-4 text-center">
      <div className="aspect-4/5 w-full overflow-hidden rounded-2xl bg-secondary ring-1 ring-border">
        {product.image ? (
          <img
            src={product.image.secureUrl}
            alt={product.image.altText || product.name}
            loading="lazy"
            className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.05]"
          />
        ) : (
          <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/10 via-secondary to-secondary">
            <Gem className="size-12 text-primary/40" strokeWidth={1.25} />
          </div>
        )}
      </div>
      <p className="font-display text-base text-heading transition-colors duration-300 group-hover:text-primary">{product.name}</p>
    </Link>
  );
}

function TrendingTileSkeleton() {
  return (
    <div className="flex flex-col items-center gap-4">
      <Skeleton className="aspect-4/5 w-full rounded-2xl" />
      <Skeleton className="h-4 w-2/3" />
    </div>
  );
}

// `bare` drops the section's own max-w-7xl/px container (still real
// content, just laid out by whatever already-padded parent embeds it -
// e.g. ProductListingPage's zero-search-results recovery block) instead of
// double-padding when nested inside another PageContainer.
export function TrendingNow({ bare = false }) {
  const { data: products, isLoading, isError, refetch } = useTrendingProducts(TILE_COUNT);

  // Real units-sold-in-30-days first, isFeatured backfill after (see
  // product.service.js#getPublicTrending) - a totally empty catalog is the
  // only way this is ever []. Rather than a mid-page empty box, the section
  // just doesn't render then, same as any other homepage section here.
  if (!isLoading && !isError && products?.length === 0) return null;

  return (
    <section className={cn(!bare && 'mx-auto min-w-0 max-w-7xl px-4 lg:px-8')}>
      <div className="mb-8 flex flex-col items-center gap-1.5 text-center sm:mb-10">
        <span className="flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
          <span className="h-px w-6 bg-primary/60" /> Trending Now <span className="h-px w-6 bg-primary/60" />
        </span>
        <h2 className="text-h3 font-display font-bold text-heading sm:text-h2">Trending Now</h2>
        <p className="max-w-md text-sm text-muted-foreground">Jewellery pieces everyone's eyeing right now</p>
      </div>

      {isError ? (
        <ErrorState description="We couldn't load trending picks right now." actionLabel="Retry" onAction={refetch} />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 sm:gap-6 lg:gap-8">
          {isLoading
            ? Array.from({ length: TILE_COUNT }).map((_, i) => <TrendingTileSkeleton key={i} />)
            : products.map((product) => <TrendingTile key={product.id} product={product} />)}
        </div>
      )}
    </section>
  );
}
