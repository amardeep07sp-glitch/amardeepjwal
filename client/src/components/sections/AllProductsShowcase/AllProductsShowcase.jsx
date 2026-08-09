import { Link } from 'react-router-dom';
import { useProductList } from '@/features/products/productsApi';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';

const PREVIEW_COUNT = 8;

// Same shape as New Arrivals: a small real preview grid with a "View All"
// link to the full catalog page - not a plain link banner. `sortBy:
// 'featured'` (curated-first, falling back to newest) rather than
// useFeaturedProducts, which would render nothing at all until someone in
// Admin actually flags a product as featured.
export function AllProductsShowcase() {
  const { data, isLoading, isError, refetch } = useProductList({ limit: PREVIEW_COUNT, sortBy: 'featured' });
  const products = data?.items ?? [];

  return (
    <section className="mx-auto min-w-0 max-w-7xl px-4 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-x-4 gap-y-2">
        <div>
          <span className="mb-1.5 flex items-center gap-2 text-xs font-semibold tracking-[0.2em] text-primary uppercase">
            <span className="h-px w-6 bg-primary/60" />
            The Full Collection
          </span>
          <h2 className="text-h3 font-display font-bold text-heading sm:text-h2">All Jewellery</h2>
        </div>
        <Link
          to="/products"
          className="group/link text-sm font-medium text-primary transition-colors hover:text-primary-hover"
        >
          View All Jewellery
          <span className="ml-1 inline-block transition-transform duration-300 group-hover/link:translate-x-1">→</span>
        </Link>
      </div>

      {isError ? (
        <ErrorState description="We couldn't load products right now." actionLabel="Retry" onAction={refetch} />
      ) : isLoading ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: PREVIEW_COUNT }).map((_, i) => (
            <ProductCardSkeleton key={i} />
          ))}
        </div>
      ) : products.length === 0 ? (
        <EmptyState title="No products yet" description="Check back soon - new pieces are on their way." />
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
