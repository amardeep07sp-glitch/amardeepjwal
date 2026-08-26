import { useSearchParams } from 'react-router-dom';
import { useCollectionList } from '@/features/collections/collectionsApi';
import { CollectionCard } from '@/components/collection';
import { Breadcrumb } from '@/components/global/Breadcrumb';
import { BackButton } from '@/components/global/BackButton';
import { EmptyState } from '@/components/global/EmptyState';
import { ErrorState } from '@/components/global/ErrorState';
import { Pagination } from '@/components/global/Pagination';
import { PageContainer } from '@/components/global/PageContainer';
import { ResponsiveGrid } from '@/components/global/ResponsiveGrid';
import { Skeleton } from '@/components/ui/skeleton';
import { useSeo } from '@/hooks/useSeo';

const PAGE_SIZE = 20;

// The collections index - a numbered grid, same convention as
// AllCategoriesPage.jsx's "index of things" page. Infinite scroll is
// reserved for a collection's own product grid (CollectionDetailPage), not
// this index.
export default function CollectionsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const page = Number(searchParams.get('page') ?? 1) || 1;

  const { data, isLoading, isError, error, refetch } = useCollectionList({ page, limit: PAGE_SIZE });

  useSeo({ title: 'Collections - Amardeep Swarna Kala Kendra', description: 'Browse curated jewellery collections.' });

  const handlePageChange = (nextPage) => {
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set('page', String(nextPage));
      return next;
    });
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <PageContainer top="sm" bottom="md">
      <div className="sticky top-[60px] lg:top-[113px] z-40 -mx-4 mb-4 flex flex-wrap items-center gap-4 bg-background/95 px-4 py-2.5 backdrop-blur-md sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8">
          <BackButton />
        <Breadcrumb items={[{ label: 'Home', to: '/' }, { label: 'Collections' }]} />
      </div>
      <h1 className="mb-5 text-h3 font-display font-bold text-heading sm:text-h2">Collections</h1>

      {isError ? (
        <ErrorState description={error?.message} actionLabel="Retry" onAction={refetch} />
      ) : isLoading ? (
        <ResponsiveGrid count={8} className="gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} className="aspect-4/3 rounded-lg" />
          ))}
        </ResponsiveGrid>
      ) : data.items.length === 0 ? (
        <EmptyState title="No collections yet" description="Collections added from the admin panel will show up here." />
      ) : (
        <>
          <ResponsiveGrid count={data.items.length} className="gap-4">
            {data.items.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </ResponsiveGrid>
          <div className="mt-8">
            <Pagination page={data.meta.page} totalPages={data.meta.totalPages} totalItems={data.meta.totalItems} onPageChange={handlePageChange} />
          </div>
        </>
      )}
    </PageContainer>
  );
}
