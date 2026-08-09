import { Link } from 'react-router-dom';
import { useNewArrivals } from '@/features/products/productsApi';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';

const SKELETON_COUNT = 4;

// A plain CSS grid, not an embla carousel - with fewer than a full row of
// products (very likely on a young catalog), a flex/embla track sized by
// basis-1/N left a lone card floating with its "Add to Cart" text clipped
// and a wall of empty space beside it. A grid divides whatever width it's
// given by however many items actually exist - it can't produce that
// failure mode at any item count or screen width.
export function NewArrivals() {
  const { data: products, isLoading, isError, refetch } = useNewArrivals(8);

  return (
    <section className="mx-auto min-w-0 max-w-7xl px-4 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            <span className="h-px w-6 bg-primary/60" />
            Just In
          </span>
          <h2 className="text-h3 font-display font-bold text-heading sm:text-h2">New Arrivals</h2>
        </div>
        <Link
          to="/new-arrivals"
          className="group/link text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          View All
          <span className="ml-1 inline-block transition-transform duration-300 group-hover/link:translate-x-1">→</span>
        </Link>
      </div>

      {isError ? (
        <ErrorState
          description="We couldn't load new arrivals right now."
          actionLabel="Retry"
          onAction={refetch}
        />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: SKELETON_COUNT }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState title="No new arrivals yet" description="Check back soon for our latest pieces." />
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </section>
  );
}
