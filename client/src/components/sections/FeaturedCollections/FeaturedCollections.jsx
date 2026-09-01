import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useCollectionList } from '@/features/collections/collectionsApi';
import { CollectionCard } from '@/components/collection';

// Real, admin-managed collections (Admin -> Catalog -> Collections) - same
// data/card CollectionsPage.jsx's own index grid uses, just capped to a
// homepage-sized row. Renders nothing at all once loaded if there are zero
// published+visible collections yet, same "no fake placeholder" rule
// ShopByCategory/Testimonials already follow on this page.
export function FeaturedCollections() {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.1 });
  const { data, isLoading } = useCollectionList({ limit: 5 });
  const collections = data?.items ?? [];

  if (!isLoading && collections.length === 0) return null;

  return (
    <section ref={ref} className="mx-auto min-w-0 max-w-7xl px-4 lg:px-8">
      <div className="mx-auto mb-3 flex items-center justify-center gap-3">
        <span className="h-px w-10 bg-primary/40 sm:w-16" />
        <span className="size-1.5 rotate-45 bg-primary" />
        <span className="h-px w-10 bg-primary/40 sm:w-16" />
      </div>
      <h2 className="text-center font-display text-h3 font-bold text-heading sm:text-h2">Shop by Collection</h2>
      <p className="mx-auto mt-2 max-w-md text-center text-sm text-muted-foreground sm:text-base">
        Curated edits for every occasion, hand-picked by our team
      </p>

      {isLoading ? (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex flex-col overflow-hidden rounded-xl bg-card ring-1 ring-border">
              <Skeleton className="aspect-4/3 w-full rounded-none" />
              <div className="flex flex-col gap-1.5 p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-32" />
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {collections.map((collection, index) => (
            <motion.div
              key={collection.id}
              initial={{ opacity: 0, y: 16 }}
              animate={inView ? { opacity: 1, y: 0 } : {}}
              transition={{ duration: 0.35, delay: index * 0.06, ease: 'easeOut' }}
            >
              <CollectionCard collection={collection} />
            </motion.div>
          ))}
        </div>
      )}

      <div className="mt-8 flex justify-center">
        <Button asChild variant="outline" size="lg" className="gap-2 rounded-full px-6">
          <Link to="/collections">
            View All Collections
            <ArrowRight className="size-4" />
          </Link>
        </Button>
      </div>
    </section>
  );
}
