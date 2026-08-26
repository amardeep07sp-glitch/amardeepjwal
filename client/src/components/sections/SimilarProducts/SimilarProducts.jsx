import { Link } from 'react-router-dom';
import { useSimilarProducts } from '@/features/products/productsApi';
import { ProductCard, ProductCardSkeleton } from '@/components/product';
import { ResponsiveGrid } from '@/components/global/ResponsiveGrid';
import { categoryPath } from '@/config/navConfig';

// ResponsiveGrid, not a plain grid - "You may also like" very often has
// just one or two real results on a young catalog, and a fixed
// `grid-cols-N` left a lone/pair of cards at a normal size but with a
// wide, empty void beside them (grid tracks don't collapse just because
// they're unused) - the exact problem ResponsiveGrid exists to solve
// everywhere else (see its own comment), just not yet wired in here.
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

      <ResponsiveGrid count={isLoading ? 4 : products.length} className="gap-4">
        {isLoading
          ? Array.from({ length: 4 }).map((_, i) => <ProductCardSkeleton key={i} />)
          : products.map((product) => <ProductCard key={product.id} product={product} />)}
      </ResponsiveGrid>
    </section>
  );
}
