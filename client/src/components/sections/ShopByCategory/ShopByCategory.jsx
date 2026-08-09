import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowRight, Gem } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/global/EmptyState';
import { CategoryIcon } from '@/components/category';
import { useHomepageCategories } from '@/features/categories/categoriesApi';
import { categoryPath } from '@/config/navConfig';

function CategoryCard({ category, index, inView }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
    >
      <Link
        to={categoryPath(category.slug)}
        className="group flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border transition-all duration-300 hover:-translate-y-1 hover:shadow-[0_20px_40px_-15px_rgba(200,162,74,0.35)] hover:ring-primary/30"
      >
        <div className="relative aspect-4/3 shrink-0 overflow-hidden bg-secondary">
          {category.thumbnailMedia ? (
            <img
              src={category.thumbnailMedia.secureUrl}
              alt={category.thumbnailMedia.altText || category.name}
              loading="lazy"
              className="size-full object-cover transition-transform duration-500 ease-out group-hover:scale-[1.06]"
            />
          ) : (
            <div className="flex size-full items-center justify-center bg-linear-to-br from-primary/10 via-secondary to-secondary">
              <Gem className="size-10 text-primary/40" strokeWidth={1.25} />
            </div>
          )}

          {/* Only when there's a real photo behind it - over the gradient
              fallback (which already shows its own large centered icon),
              this badge just doubled up on top of it and looked cluttered. */}
          {category.thumbnailMedia && (
            <span className="absolute top-3 left-3 flex size-10 items-center justify-center rounded-full bg-card/95 text-primary shadow-sm ring-1 ring-primary/20">
              <CategoryIcon category={category} className="size-5" />
            </span>
          )}
        </div>

        <div className="flex flex-col items-center gap-1 px-3 py-4 text-center">
          <p className="font-nav text-base font-light text-heading sm:text-lg">{category.name}</p>
          <p className="text-xs font-medium text-primary sm:text-sm">
            {category.productCountRecursive ?? category.productCount ?? 0} Designs
          </p>
          <ArrowRight className="mt-1 size-4 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-primary" />
        </div>
      </Link>
    </motion.div>
  );
}

function CategoryCardSkeleton() {
  return (
    <div className="flex flex-col overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <Skeleton className="aspect-4/3 w-full rounded-none" />
      <div className="flex flex-col items-center gap-2 px-3 py-4">
        <Skeleton className="h-5 w-20" />
        <Skeleton className="h-3.5 w-16" />
      </div>
    </div>
  );
}

// A real-photo card grid (matching the client-approved reference design)
// instead of the earlier plain icon-circle row - same real data underneath
// (live categories, real thumbnails, real recursive product counts), just a
// richer card treatment.
export function ShopByCategory() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { data: categories, isLoading } = useHomepageCategories(8);

  return (
    <section ref={ref} className="mx-auto min-w-0 max-w-7xl px-4 lg:px-8">
      <div className="mx-auto mb-3 flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-primary/40 sm:w-16" />
        <span className="size-1.5 rotate-45 bg-primary" />
        <span className="h-px w-10 bg-primary/40 sm:w-16" />
      </div>
      <h2 className="text-center font-display text-h3 font-bold text-heading sm:text-h2">Shop by Category</h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground sm:text-base">
        Discover our finest designs across all jewellery categories
      </p>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <CategoryCardSkeleton key={i} />
          ))}
        </div>
      ) : !categories || categories.length === 0 ? (
        <div className="mt-8">
          <EmptyState title="No categories yet" description="Categories added from the admin panel will show up here." />
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          {categories.map((category, index) => (
            <CategoryCard key={category.id} category={category} index={index} inView={inView} />
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline" size="lg" className="gap-2 rounded-full px-6">
          <Link to="/categories">
            Explore All Categories
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
