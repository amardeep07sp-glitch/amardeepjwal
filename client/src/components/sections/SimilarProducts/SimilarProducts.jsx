import { Link } from 'react-router-dom';
import { useSimilarProducts } from '@/features/products/productsApi';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { categoryPath } from '@/config/navConfig';

// A plain grid, not a carousel - "You may also like" very often has just
// one or two real results on a young catalog, and a flex/embla track
// stretched across the full section width left a lone card floating with
// a clipped "Add to Cart" and a wall of empty space beside it (see
// NewArrivals.jsx for the same fix and the full explanation). A grid
// simply uses only as many columns as there are products.
export function SimilarProducts({ slug, categorySlug }) {
  const { data: products, isLoading } = useSimilarProducts(slug, 8);

  if (!isLoading && (!products || products.length === 0)) return null;

  return (
    <section className="mx-auto min-w-0 max-w-7xl px-4 py-10 lg:px-8">
      <div className="mb-6 flex items-end justify-between">
        <h2 className="text-h3 font-display font-bold text-heading sm:text-h2">You May Also Like</h2>
        {categorySlug && (
          <Link to={categoryPath(categorySlug)} className="text-sm font-medium text-primary hover:underline">
            View All →
          </Link>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </div>
    </section>
  );
}
